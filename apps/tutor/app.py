import os
import re
import json
import hashlib
import sqlite3
import logging
import numpy as np
import requests
from flask import Flask, request, jsonify, render_template, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from openai import OpenAI
import faiss
from dotenv import load_dotenv

_root_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
load_dotenv(_root_env)
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ── Rate Limiter ────────────────────────────────────────────────────────────
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# ── Config ──────────────────────────────────────────────────────────────────
OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or os.getenv("NIBRAS_AI_API_KEY") or "").strip()
if not OPENAI_API_KEY:
    raise ValueError(
        "OPENAI_API_KEY or NIBRAS_AI_API_KEY not found. Add one to the repo root .env file."
    )

CHAT_MODEL        = os.getenv("NIBRAS_AI_MODEL", "gpt-4o-mini")
OPENAI_BASE_URL   = (os.getenv("NIBRAS_AI_BASE_URL") or "").strip() or None
THRESHOLD         = 0.55
DB_FILE           = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embeddings_cache.db")
NIBRAS_API_URL    = os.getenv("NIBRAS_API_URL", "http://127.0.0.1:4848/v1/community")
QUESTIONS_URL     = f"{NIBRAS_API_URL}/questions"
AI_USER_ID        = os.getenv("AI_USER_ID", "")

# In-memory question cache to avoid hammering the API on every request
_questions_cache: dict = {}   # tag -> (timestamp, list)
_all_questions_cache: tuple = (0.0, [])   # (timestamp, list) — cache for full question list
CACHE_TTL_SECONDS = 60

client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)


def openai_client_for_request(body: dict) -> tuple[OpenAI, str]:
    """Use per-request BYOK credentials when the API proxy forwards them."""
    api_key = (body.get("api_key") or "").strip()
    model = (body.get("model") or "").strip() or CHAT_MODEL
    if api_key:
        return OpenAI(api_key=api_key, base_url=OPENAI_BASE_URL), model
    return client, CHAT_MODEL

# ── CS Keywords ──────────────────────────────────────────────────────────────
CS_KEYWORDS = {
    "ecir", "cissp", "ceh", "security+", "oscp", "gcih", "gpen", "elearnsecurity",
    "comptia", "cism", "cisa", "crisc", "ccna", "ccnp", "aws certified",
    "azure certified", "gcp certified", "pmp", "itil",
    "incident response", "forensics", "malware", "ransomware", "phishing",
    "firewall", "ids", "ips", "vpn", "tls", "ssl", "encryption", "decryption",
    "hashing", "sha256", "md5", "bcrypt", "aes", "rsa", "ecc", "diffie",
    "penetration testing", "pentest", "red team", "blue team", "soc", "siem",
    "owasp", "xss", "csrf", "sql injection", "idor", "xxe", "ssrf",
    "buffer overflow", "privilege escalation", "aslr", "dep", "stack canary",
    "metasploit", "burp suite", "nmap", "wireshark", "john the ripper",
    "hashcat", "sqlmap", "gobuster", "dirb", "nikto",
    "sql", "tcp", "udp", "http", "https", "ftp", "ssh", "dns", "dhcp", "smtp",
    "api", "rest", "graphql", "grpc", "json", "xml", "yaml", "csv",
    "ram", "rom", "cpu", "gpu", "alu", "cu", "pc", "ir", "mmu", "tlb", "dma",
    "ide", "cli", "gui", "sdk", "mvc", "mvvm", "mvp", "oop",
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust",
    "kotlin", "swift", "php", "ruby", "perl", "haskell", "scala", "r", "matlab",
    "assembly", "asm", "bash", "powershell", "pl/sql",
    "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "git",
    "github", "gitlab", "bitbucket", "aws", "azure", "gcp", "linux", "unix",
    "windows server", "nginx", "apache", "mysql", "postgresql", "mongodb",
    "redis", "elasticsearch", "kafka", "rabbitmq", "load balancer",
    "algorithm", "data structure", "big o", "big-o", "time complexity", "space complexity",
    "recursion", "dynamic programming", "greedy", "backtracking", "divide conquer",
    "graph", "tree", "binary tree", "bst", "avl", "red black", "heap", "trie",
    "hash table", "linked list", "stack", "queue", "array", "matrix", "vector", "garbage collection",
    "sorting", "searching", "bfs", "dfs", "dijkstra", "bellman", "floyd", "a*",
    "machine learning", "deep learning", "neural network", "cnn", "rnn", "lstm",
    "transformer", "bert", "gpt", "llm", "nlp", "cv", "reinforcement learning",
    "supervised", "unsupervised", "semi-supervised", "self-supervised",
    "database", "dbms", "rdbms", "nosql", "query", "index", "join",
    "transaction", "acid", "cap theorem", "normalization", "denormalization",
    "operating system", "process", "thread", "scheduling", "deadlock", "mutex",
    "semaphore", "virtual memory", "paging", "segmentation", "file system",
    "computer network", "osi model", "tcp/ip", "routing", "switching", "subnet",
    "nat", "vlan", "mpls", "bgp", "ospf", "rip", "icmp", "arp",
    "software engineering", "agile", "scrum", "kanban", "waterfall", "tdd",
    "bdd", "ci/cd", "devops", "microservices", "serverless", "event driven",
    "design pattern", "singleton", "factory", "observer", "strategy", "adapter",
    "compiler", "interpreter", "lexer", "parser", "ast", "bytecode", "jit",
    "automata", "dfa", "nfa", "turing machine", "p vs np", "np complete",
    "cryptography", "pki", "certificate", "digital signature", "key exchange",
    "blockchain", "cryptocurrency", "bitcoin", "ethereum", "smart contract",
    "web development", "frontend", "backend", "fullstack", "react", "vue",
    "angular", "django", "flask", "fastapi", "express", "spring boot",
    "mobile development", "android", "ios", "flutter", "react native",
    "data science", "data engineering", "data analytics", "big data", "spark",
    "hadoop", "airflow", "etl", "data warehouse", "data lake",
    "cloud computing", "iaas", "paas", "saas", "faas",
    "distributed systems", "consensus", "paxos", "raft", "mapreduce",
    "human computer interaction", "ux", "ui", "accessibility", "usability",
    "visual computing", "computer graphics", "opengl", "vulkan", "ray tracing",
    "game development", "unity", "unreal engine", "physics engine",
    "embedded systems", "iot", "rtos", "microcontroller", "arduino", "raspberry",
    "robotics", "control systems", "pid", "kalman filter", "slam",
    "quantum computing", "qubit", "quantum algorithm", "shor", "grover",
    "linear algebra", "calculus", "probability", "statistics", "discrete math",
    "graph theory", "number theory", "combinatorics", "boolean algebra",
    "eigenvalue", "eigenvector", "gradient", "derivative", "integral",
    "bayes", "markov", "entropy", "information theory", "fourier", "laplace",
    "fft", "fast fourier transform", "dft", "discrete fourier", "z-transform",
    "convolution", "signal processing", "nyquist", "sampling theorem",
    "learn", "understand", "implement", "code", "program", "build", "study",
    "practice", "master", "tutorial", "course", "resources", "roadmap",
    "security", "track", "cybersecurity", "hacking", "ethical hacking",
}

def is_cs_related(question: str) -> bool:
    q_lower = question.lower()

    # Fast-path for exact or similar suggested prompts in the UI
    q_clean = re.sub(r"[^\w\s]", "", q_lower).strip()
    suggested_prompts_clean = {
        "explain bigo notation with examples",
        "what is a binary search tree",
        "how does tcpip work",
        "explain recursion vs iteration",
        "what are design patterns in oop",
        "how does garbage collection work",
    }
    if q_clean in suggested_prompts_clean:
        return True

    for kw in CS_KEYWORDS:
        if kw in q_lower:
            return True

    if re.findall(r'\b[A-Z]{2,}\b', question):
        return True

    if re.search(r'\b(learn|understand|implement|code|program|study|practice|build|start|begin|roadmap|track)\b', q_lower):
        return True

    return False


# ── Tag Correction Map ───────────────────────────────────────────────────────
TAG_CORRECTION_MAP = {
    "operating-systems": [
        "mkdir", "ls", "ls -lh", "ls -la", "cd", "chmod", "chown", "grep", "awk", "sed",
        "ps", "kill", "killall", "top", "htop", "df", "du", "mount", "umount", "cp", "mv",
        "rm", "find", "cat", "echo", "touch", "nano", "vim", "vi", "sudo", "su", "apt",
        "apt-get", "yum", "dnf", "pacman", "tar", "zip", "unzip", "ln", "pwd", "whoami",
        "man", "which", "whereis", "env", "export", "alias", "cron", "crontab", "systemctl",
        "service", "journalctl", "dmesg", "ifconfig", "ip addr", "netstat", "ping",
        "traceroute", "curl", "wget", "ssh", "scp", "rsync", "pipe", "redirect", ">",
        ">>", "|", "operating system", "kernel", "process", "thread", "scheduler",
        "scheduling", "deadlock", "mutex", "semaphore", "monitor", "spinlock",
        "paging", "segmentation", "virtual memory", "page fault", "tlb", "file system",
        "inode", "fat", "ntfs", "ext4", "journaling", "interrupt", "system call",
        "context switch", "pcb", "fork", "exec", "zombie process", "daemon", "shell",
        "bash", "zsh", "terminal", "linux", "unix", "windows", "macos", "posix",
        "boot", "bootloader", "grub", "disk scheduling", "sstf", "scan", "c-scan",
        "fcfs", "round robin", "priority scheduling", "sjf", "multilevel queue",
        "memory management", "heap", "stack memory", "aslr", "dep", "buffer overflow",
        "race condition", "critical section",
    ],
    "computer-networks": [
        "tcp", "udp", "ip", "ipv4", "ipv6", "http", "https", "ftp", "dns", "dhcp",
        "smtp", "pop3", "imap", "arp", "icmp", "mac address", "router", "switch",
        "hub", "gateway", "firewall", "proxy", "subnet", "subnetting", "cidr", "nat",
        "vlan", "mpls", "bgp", "ospf", "rip", "eigrp", "routing", "switching",
        "osi model", "tcp/ip model", "network layer", "transport layer", "data link",
        "physical layer", "application layer", "packet", "frame", "datagram",
        "bandwidth", "latency", "throughput", "socket", "port", "handshake",
        "three-way handshake", "flow control", "congestion control", "sliding window",
        "ethernet", "wi-fi", "wireless", "bluetooth", "vpn", "tunnel", "load balancer",
        "cdn", "websocket", "http/2", "http/3", "quic",
    ],
    "security": [
        "encryption", "decryption", "cipher", "cryptography", "hash", "sha", "md5",
        "bcrypt", "aes", "rsa", "ecc", "diffie-hellman", "digital signature", "pki",
        "certificate", "tls", "ssl", "firewall", "ids", "ips", "siem", "soc",
        "malware", "ransomware", "virus", "trojan", "worm", "spyware", "phishing",
        "social engineering", "pretexting", "xss", "csrf", "sql injection", "idor",
        "xxe", "ssrf", "buffer overflow", "privilege escalation", "stack canary",
        "penetration testing", "pentest", "red team", "blue team", "metasploit",
        "burp suite", "nmap", "wireshark", "sqlmap", "owasp", "vulnerability",
        "exploit", "payload", "shellcode", "ctf", "capture the flag", "reverse engineering",
        "cissp", "ceh", "ecir", "oscp", "gcih", "security+", "iso 27001", "nist",
        "gdpr", "incident response", "security track", "cybersecurity", "hacking",
        "ethical hacking", "security career", "security roadmap", "start security",
        "learn security", "security field", "security path", "infosec",
    ],
    "algorithms": [
        "sorting", "bubble sort", "selection sort", "insertion sort", "merge sort",
        "quick sort", "heap sort", "counting sort", "radix sort", "bucket sort",
        "tim sort", "searching", "binary search", "linear search", "interpolation search",
        "bfs", "dfs", "dijkstra", "bellman-ford", "floyd-warshall", "a*", "prim",
        "kruskal", "topological sort", "tarjan", "dynamic programming", "memoization",
        "tabulation", "knapsack", "lcs", "lis", "edit distance", "coin change",
        "greedy", "activity selection", "huffman", "two pointers", "sliding window",
        "prefix sum", "divide and conquer", "backtracking", "big o", "time complexity",
        "space complexity", "amortized analysis", "recurrence relation", "master theorem",
        "kmp", "rabin-karp", "z-algorithm", "aho-corasick",
    ],
    "data-structures": [
        "array", "linked list", "singly linked", "doubly linked", "circular linked",
        "stack", "queue", "deque", "priority queue", "circular queue", "hash table",
        "hash map", "hash set", "chaining", "open addressing", "tree", "binary tree",
        "bst", "avl tree", "red-black tree", "b-tree", "b+ tree", "segment tree",
        "trie", "suffix tree", "heap", "min heap", "max heap", "fibonacci heap",
        "graph", "adjacency matrix", "adjacency list", "union find", "disjoint set",
        "bloom filter", "skip list", "sparse table", "fenwick tree", "bit indexed tree",
    ],
    "database": [
        "sql", "query", "select", "insert", "update", "delete", "join", "inner join",
        "left join", "right join", "full join", "cross join", "subquery", "cte",
        "view", "stored procedure", "trigger", "function", "index", "clustered index",
        "b-tree index", "hash index", "normalization", "1nf", "2nf", "3nf", "bcnf",
        "denormalization", "acid", "atomicity", "consistency", "isolation", "durability",
        "transaction", "commit", "rollback", "savepoint", "concurrency", "deadlock",
        "2pl", "mvcc", "isolation level", "nosql", "mongodb", "redis", "cassandra",
        "neo4j", "elasticsearch", "cap theorem", "base", "sharding", "replication",
        "er diagram", "entity", "relationship", "foreign key", "primary key", "mysql",
        "postgresql", "sqlite", "oracle", "sql server", "orm", "query optimization",
        "execution plan",
    ],
    "artificial-intelligence": [
        "artificial intelligence", "ai agent", "peas", "rational agent", "search algorithm",
        "minimax", "alpha-beta", "mcts", "constraint satisfaction", "csp", "backtracking search",
        "knowledge representation", "propositional logic", "first-order logic", "bayesian network",
        "inference", "resolution", "expert system", "fuzzy logic", "planning",
    ],
    "machine-learning": [
        "machine learning", "supervised learning", "unsupervised learning",
        "reinforcement learning", "semi-supervised", "linear regression", "logistic regression",
        "decision tree", "random forest", "xgboost", "gradient boosting", "svm", "k-nn",
        "naive bayes", "k-means", "dbscan", "pca", "t-sne", "cross-validation", "overfitting",
        "underfitting", "bias variance", "regularization", "l1", "l2", "dropout",
        "batch normalization", "neural network", "perceptron", "mlp", "backpropagation",
        "cnn", "rnn", "lstm", "gru", "transformer", "attention", "bert", "gpt", "llm",
        "embedding", "fine-tuning", "gan", "vae", "diffusion model", "transfer learning",
        "confusion matrix", "precision", "recall", "f1", "roc", "auc",
    ],
    "web-development": [
        "html", "css", "javascript", "typescript", "dom", "fetch", "react", "vue", "angular",
        "svelte", "next.js", "nuxt", "django", "flask", "fastapi", "express", "spring boot",
        "rest api", "graphql", "websocket", "grpc", "jwt", "oauth", "session", "cookie",
        "cors", "csp", "responsive design", "flexbox", "css grid", "bootstrap", "tailwind",
        "webpack", "vite", "babel", "npm", "yarn",
    ],
    "software-engineering": [
        "agile", "scrum", "kanban", "waterfall", "spiral", "xp", "tdd", "bdd", "unit test",
        "integration test", "system test", "design pattern", "singleton", "factory", "observer",
        "strategy", "adapter", "decorator", "facade", "proxy", "command", "iterator",
        "mvc", "mvp", "mvvm", "microservices", "event-driven", "solid", "dry", "kiss",
        "yagni", "clean code", "refactoring", "ci/cd", "git", "github", "gitlab",
        "version control", "uml", "class diagram", "sequence diagram", "use case",
        "requirements engineering", "user story", "sprint", "backlog",
    ],
    "devops": [
        "docker", "kubernetes", "k8s", "container", "pod", "deployment", "terraform", "ansible",
        "puppet", "chef", "infrastructure as code", "jenkins", "github actions", "gitlab ci",
        "circleci", "ci/cd pipeline", "continuous integration", "continuous deployment",
        "prometheus", "grafana", "elk stack", "log aggregation", "nginx", "apache",
        "load balancing", "reverse proxy", "helm", "istio", "service mesh",
    ],
    "cloud-computing": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "ec2", "s3", "lambda",
        "rds", "dynamodb", "cloudfront", "iaas", "paas", "saas", "faas", "serverless",
        "cloud storage", "cloud computing", "auto scaling", "availability zone", "region",
        "vpc", "cloud native",
    ],
    "distributed-systems": [
        "distributed system", "consensus", "paxos", "raft", "mapreduce", "hadoop", "spark",
        "kafka", "rabbitmq", "eventual consistency", "strong consistency", "cap theorem",
        "fault tolerance", "replication", "sharding", "partitioning", "leader election",
        "distributed transaction", "two-phase commit", "microservices", "service discovery",
        "api gateway",
    ],
    "compiler-design": [
        "compiler", "interpreter", "lexer", "tokenizer", "parser", "lexical analysis",
        "syntax analysis", "semantic analysis", "token", "grammar", "cfg", "context free grammar",
        "parse tree", "ast", "abstract syntax tree", "ll parser", "lr parser", "slr", "clr",
        "lalr", "recursive descent", "yacc", "flex", "antlr", "intermediate code",
        "three address code", "ssa", "code generation", "register allocation", "instruction selection",
        "optimization", "constant folding", "dead code elimination", "llvm", "bytecode",
        "jit compilation",
    ],
    "theory-of-computation": [
        "automata", "dfa", "nfa", "finite automaton", "regular expression", "regular language",
        "pumping lemma", "context free language", "cfg", "push down automaton", "pda",
        "turing machine", "decidability", "halting problem", "reduction", "rice theorem",
        "p vs np", "np complete", "np hard", "pspace", "cook levin", "sat", "3-sat",
        "clique", "vertex cover", "complexity class", "time complexity class", "space complexity class",
    ],
    "computer-architecture": [
        "von neumann", "harvard architecture", "cpu architecture", "alu", "control unit",
        "program counter", "instruction register", "fetch decode execute", "instruction cycle",
        "risc", "cisc", "instruction set architecture", "pipeline hazard", "data hazard",
        "control hazard", "branch prediction", "superscalar", "out-of-order execution",
        "l1 cache", "l2 cache", "l3 cache", "cache hit", "cache miss", "cache coherence",
        "direct mapped cache", "set associative cache", "write-back", "write-through",
        "memory hierarchy", "dram", "sram", "dma controller", "hardware interrupt",
        "two's complement", "ieee 754", "floating point representation", "boolean algebra",
        "logic gate", "logic circuit", "xor gate", "nand gate", "flip flop", "register file",
        "multiplexer", "decoder circuit", "combinational circuit", "sequential circuit",
        "finite state machine",
    ],
    "math": [
        "discrete mathematics", "propositional logic", "predicate logic", "proof", "induction",
        "contradiction", "contrapositive", "set theory", "relation", "function", "bijection",
        "permutation", "combination", "pigeonhole", "inclusion exclusion", "generating function",
        "recurrence", "probability", "conditional probability", "bayes theorem", "random variable",
        "distribution", "expectation", "variance", "central limit theorem", "markov chain",
        "entropy", "information theory", "number theory", "gcd", "lcm", "prime", "modular arithmetic",
        "fermat", "euler totient", "chinese remainder theorem", "graph theory", "euler path",
        "hamiltonian", "planarity", "coloring",
    ],
    "linear-algebra": [
        "linear algebra", "vector", "matrix", "determinant", "gaussian elimination", "eigenvalue",
        "eigenvector", "vector space", "basis", "span", "linear independence", "dot product",
        "cross product", "norm", "orthogonal", "svd", "singular value decomposition", "pca",
        "linear transformation", "rank", "null space",
    ],
    "programming-languages": [
        "programming paradigm", "functional programming", "imperative", "declarative",
        "object oriented", "oop", "class", "object", "inheritance", "polymorphism",
        "encapsulation", "abstraction", "closure", "lambda", "higher order function",
        "recursion", "pointer", "reference", "memory management", "garbage collection",
        "type system", "static typing", "dynamic typing", "type inference", "generics",
        "template", "overloading", "overriding", "exception handling", "concurrency",
        "parallelism", "coroutine", "async", "await", "promise",
    ],
}


def correct_tags(question: str, ai_tags: list) -> list:
    q_lower = question.lower()
    corrected = set()

    for tag, keywords in TAG_CORRECTION_MAP.items():
        for kw in keywords:
            if kw in q_lower:
                corrected.add(tag)
                break

    if not corrected:
        corrected = set(ai_tags)

    corrected = {tag.lower() for tag in corrected}

    if {"operating-systems", "algorithms", "data-structures"} & corrected:
        corrected.discard("systems")

    return sorted(list(corrected))


# ── Database ─────────────────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS emb_cache (
            q_id      TEXT,
            text_hash TEXT,
            embedding BLOB,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            PRIMARY KEY (q_id, text_hash)
        )
    """)
    conn.commit()
    return conn


def get_db():
    if "db" not in g:
        g.db = init_db()
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db:
        db.close()


def cache_get(q_id, text_hash):
    conn = get_db()
    row = conn.execute(
        "SELECT embedding FROM emb_cache WHERE q_id=? AND text_hash=?",
        (q_id, text_hash)
    ).fetchone()
    if row:
        return np.frombuffer(row[0], dtype="float32").tolist()
    return None


def cache_set(q_id, text_hash, embedding):
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO emb_cache VALUES (?,?,?,strftime('%s','now'))",
        (q_id, text_hash, np.array(embedding, dtype="float32").tobytes())
    )
    conn.commit()


def cache_cleanup(valid_ids: list, max_age_days: int = 30):
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    try:
        if valid_ids:
            placeholders = ",".join("?" * len(valid_ids))
            conn.execute(
                f"DELETE FROM emb_cache WHERE q_id NOT IN ({placeholders})",
                valid_ids
            )
        else:
            conn.execute("DELETE FROM emb_cache")

        conn.execute(
            "DELETE FROM emb_cache WHERE created_at < strftime('%s','now') - ?",
            (max_age_days * 86400,)
        )
        conn.commit()
        logger.info("[CacheCleanup] Done.")
    finally:
        conn.close()


# ── Railway API helpers ───────────────────────────────────────────────────────
def _parse_questions(qs: list) -> list:
    result = []
    for q in qs:
        title      = (q.get("title") or "").strip()
        body_raw   = (q.get("body") or "").strip()
        body_clean = re.sub(r'!\[.*?\]\(.*?\)', '', body_raw).strip()
        search_text   = f"{title} {body_clean}".strip() if body_clean else title
        question_text = f"{title} — {body_clean}".strip() if body_clean else title
        result.append({
            "id":            q.get("_id", ""),
            "title":         title,
            "body":          body_clean,
            "question_text": question_text,
            "search_text":   search_text,
            "tags":          q.get("tags") or [],
            "author":        (q.get("author") or {}).get("name", "Unknown"),
            "answersCount":  q.get("answersCount", 0),
            "votesCount":    q.get("votesCount", 0),
            "createdAt":     q.get("createdAt", ""),
        })
    return result


def _extract_questions_from_response(data: dict) -> tuple[list, dict]:
    if "data" in data and isinstance(data["data"], dict):
        questions  = data["data"].get("questions", [])
        pagination = data["data"].get("pagination", {})
    elif "questions" in data:
        questions  = data.get("questions", [])
        pagination = data.get("pagination", {})
    else:
        questions  = []
        pagination = {}

    return questions, pagination


def fetch_questions() -> list:
    import time
    global _all_questions_cache

    now = time.time()
    if _all_questions_cache[0] and (now - _all_questions_cache[0]) < CACHE_TTL_SECONDS:
        logger.info(f"[Cache HIT] full question list ({len(_all_questions_cache[1])} questions)")
        return _all_questions_cache[1]

    all_questions = []
    page = 1

    while True:
        try:
            resp = requests.get(
                QUESTIONS_URL,
                params={"page": page, "limit": 50},
                timeout=10
            )
            resp.raise_for_status()
            data = resp.json()

            raw_qs, pagination = _extract_questions_from_response(data)
            if not raw_qs:
                logger.info(f"[Railway] Page {page} returned 0 questions — stopping.")
                break

            all_questions.extend(_parse_questions(raw_qs))

            total_pages = pagination.get("totalPages", 1)
            logger.info(
                f"[Railway] Page {page}/{total_pages} → {len(raw_qs)} questions "
                f"(total so far: {len(all_questions)})"
            )

            if page >= total_pages:
                break
            page += 1

        except Exception as e:
            logger.error(f"[Railway Error] page={page} → {e}")
            break

    logger.info(f"[Railway] Finished. Total questions fetched: {len(all_questions)}")
    _all_questions_cache = (now, all_questions)
    return all_questions


def fetch_questions_by_tag(tag: str) -> list:
    import time
    now = time.time()
    cached = _questions_cache.get(tag)
    if cached and (now - cached[0]) < CACHE_TTL_SECONDS:
        logger.info(f"[Cache HIT] tag='{tag}' ({len(cached[1])} questions)")
        return cached[1]

    qs = []

    try:
        resp = requests.get(
            QUESTIONS_URL,
            params={"tag": tag, "limit": 50},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        raw_qs, _ = _extract_questions_from_response(data)
        qs = _parse_questions(raw_qs)
        logger.info(f"[Railway] tag='{tag}' filter endpoint → {len(qs)} questions")
    except Exception as e:
        logger.error(f"[Railway tag fetch Error] tag={tag} → {e}")

    if not qs:
        logger.warning(
            f"[Railway] tag='{tag}' endpoint returned 0 — "
            f"falling back to full fetch + manual filter"
        )
        all_qs = fetch_questions()
        qs = [
            q for q in all_qs
            if tag.lower() in [t.lower() for t in q["tags"]]
        ]
        logger.info(f"[Fallback] tag='{tag}' → {len(qs)} questions after manual filter")

    _questions_cache[tag] = (now, qs)
    return qs


def fetch_community_answers(question_id: str) -> list:
    url = f"{NIBRAS_API_URL}/questions/{question_id}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if "data" in data and isinstance(data["data"], dict):
            return data["data"].get("answers", [])
        return data.get("answers", [])
    except Exception as e:
        logger.error(f"[Railway fetch_answers Error] {e}")
        return []


def post_answer_to_railway(question_id: str, answer_body: str) -> bool:
    url     = f"{NIBRAS_API_URL}/questions/{question_id}/answers"
    payload = {"body": answer_body}
    if AI_USER_ID:
        payload["author"] = AI_USER_ID
    try:
        resp = requests.post(url, json=payload, timeout=10)
        logger.info(f"[Railway POST] {url} → {resp.status_code}")
        return resp.status_code in (200, 201)
    except Exception as e:
        logger.error(f"[Railway POST Error] {e}")
        return False


# ── Embeddings ────────────────────────────────────────────────────────────────
def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return [item.embedding for item in response.data]


def is_meaningful(title: str, body: str) -> bool:
    combined   = f"{title} {body}".lower().strip()
    real_chars = sum(1 for c in combined if c.isalpha())
    if real_chars < 5:
        return False
    if len(combined) < 20:
        unique_ratio = len(set(combined)) / len(combined)
        if unique_ratio < 0.3:
            return False
    words      = combined.split()
    real_words = [w for w in words if len(w) >= 3 and w.isalpha()]
    return len(real_words) > 0


def title_bonus(user_query: str, question_title: str) -> float:
    stop = {
        "what", "is", "are", "the", "a", "an", "how", "why", "when", "where", "which",
        "does", "do", "can", "could", "would", "should", "in", "of", "to", "for",
        "with", "and", "or", "vs", "between", "difference", "explain", "define",
        "give", "me", "us", "i", "?",
    }
    q = set(user_query.lower().split()) - stop
    t = set(question_title.lower().split()) - stop
    if not q or not t:
        return 0.0
    jaccard = len(q & t) / len(q | t)
    return jaccard * 0.20


# ── Semantic search ───────────────────────────────────────────────────────────
def _semantic_match(query: str, questions: list) -> tuple:
    meaningful = [q for q in questions if is_meaningful(q["title"], q["body"])]
    if not meaningful:
        return None, 0.0

    title_texts = [q["title"] for q in meaningful]
    combined_texts = [
        f"{q['title']} {q['body']}".strip() if q["body"] else q["title"]
        for q in meaningful
    ]

    title_embeddings:    list = [None] * len(meaningful)
    combined_embeddings: list = [None] * len(meaningful)

    uncached_title_idx:      list[int] = []
    uncached_combined_idx:   list[int] = []
    uncached_title_texts:    list[str] = []
    uncached_combined_texts: list[str] = []

    for i, q in enumerate(meaningful):
        t_hash = hashlib.md5(("title__" + title_texts[i]).encode()).hexdigest()
        c_hash = hashlib.md5(combined_texts[i].encode()).hexdigest()

        cached_t = cache_get(q["id"], t_hash)
        cached_c = cache_get(q["id"], c_hash)

        if cached_t:
            title_embeddings[i] = cached_t
        else:
            uncached_title_idx.append(i)
            uncached_title_texts.append(title_texts[i])

        if cached_c:
            combined_embeddings[i] = cached_c
        else:
            uncached_combined_idx.append(i)
            uncached_combined_texts.append(combined_texts[i])

    all_uncached_texts = uncached_title_texts + uncached_combined_texts
    if all_uncached_texts:
        all_embeddings   = get_embeddings_batch(all_uncached_texts)
        title_results    = all_embeddings[:len(uncached_title_texts)]
        combined_results = all_embeddings[len(uncached_title_texts):]

        for idx, emb in zip(uncached_title_idx, title_results):
            q      = meaningful[idx]
            t_hash = hashlib.md5(("title__" + title_texts[idx]).encode()).hexdigest()
            cache_set(q["id"], t_hash, emb)
            title_embeddings[idx] = emb

        for idx, emb in zip(uncached_combined_idx, combined_results):
            q      = meaningful[idx]
            c_hash = hashlib.md5(combined_texts[idx].encode()).hexdigest()
            cache_set(q["id"], c_hash, emb)
            combined_embeddings[idx] = emb

    query_emb = get_embeddings_batch([query])[0]

    title_vecs    = np.array(title_embeddings,    dtype="float32")
    combined_vecs = np.array(combined_embeddings, dtype="float32")
    q_vec         = np.array([query_emb],         dtype="float32")

    faiss.normalize_L2(title_vecs)
    faiss.normalize_L2(combined_vecs)
    faiss.normalize_L2(q_vec)

    k = min(5, len(meaningful))

    idx_t = faiss.IndexFlatIP(title_vecs.shape[1])
    idx_c = faiss.IndexFlatIP(combined_vecs.shape[1])
    idx_t.add(title_vecs)
    idx_c.add(combined_vecs)

    t_scores, t_ids = idx_t.search(q_vec, k)
    c_scores, c_ids = idx_c.search(q_vec, k)

    score_map: dict[int, float] = {}
    for i in range(k):
        idx = int(t_ids[0][i])
        score_map[idx] = max(score_map.get(idx, 0.0), float(t_scores[0][i]))
    for i in range(k):
        idx = int(c_ids[0][i])
        score_map[idx] = max(score_map.get(idx, 0.0), float(c_scores[0][i]))

    best_q, best_score = None, 0.0
    for idx, cos in score_map.items():
        q     = meaningful[idx]
        final = cos + title_bonus(query, q["title"])
        if final > best_score:
            best_score, best_q = final, q

    return best_q, best_score


def tag_loop_semantic_search(query: str, ai_tags: list) -> tuple:
    top_tags = ai_tags[:3]
    logger.info(f"[TagLoop] Starting loop over tags: {top_tags}")

    for tag in top_tags:
        logger.info(f"[TagLoop] Trying tag='{tag}' ...")
        questions = fetch_questions_by_tag(tag)
        if not questions:
            logger.info(f"[TagLoop] No questions for tag='{tag}', skipping.")
            continue

        best_q, best_score = _semantic_match(query, questions)
        logger.info(
            f"[TagLoop] tag='{tag}' → best='{best_q['title'] if best_q else None}' "
            f"score={best_score:.3f}"
        )

        if best_q and best_score >= THRESHOLD:
            logger.info(f"[TagLoop] ✅ Match found under tag='{tag}' score={best_score:.3f}")
            return best_q, best_score, tag

    logger.info("[TagLoop] ❌ No match found across all tags.")
    return None, 0.0, None


# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
You are an AI academic tutor for university Computer Science students.
Answer ANY question that has a CS context. When in doubt → answer it as CS.

════════════════════════════════
COMPLETE CS KNOWLEDGE DOMAIN
════════════════════════════════

1. PROGRAMMING FUNDAMENTALS: variables, data types, type casting, operators, control flow (if/else, loops, switch), functions, recursion, scope, pointers, arrays, strings, I/O, error handling, debugging, pseudocode.

2. OOP: classes/objects, constructors/destructors, encapsulation, abstraction, inheritance (single/multiple/multilevel), polymorphism (overloading/overriding), interfaces, abstract classes, access modifiers, static members, SOLID principles, UML, design patterns overview.

3. DATA STRUCTURES: arrays, linked lists (singly/doubly/circular), stacks, queues (circular/priority/deque), hash tables (chaining/open addressing), trees (BST/AVL/Red-Black/B-tree/segment/trie/suffix), heaps (min/max), graphs (directed/undirected/weighted, adjacency matrix/list), sets, maps, bloom filters, skip lists, Union-Find.

4. ALGORITHMS: Big-O/Ω/Θ analysis, amortized analysis. Sorting: bubble/selection/insertion/merge/quick/heap/counting/radix/bucket. Searching: linear/binary/interpolation. Graph: BFS/DFS/Dijkstra/Bellman-Ford/Floyd-Warshall/A*/Prim/Kruskal/topological sort/Tarjan SCC. DP: memoization/tabulation/knapsack/LCS/LIS/edit distance/coin change. Greedy: activity selection/Huffman. String: KMP/Rabin-Karp/Z-algo/Aho-Corasick. Math: GCD/primes/sieve/modular arithmetic/FFT. Bit manipulation, two pointers, sliding window, prefix sums.

5. PROGRAMMING LANGUAGES: paradigms (imperative/functional/OOP/declarative). Python: comprehensions/generators/decorators/GIL. C/C++: pointers/memory management/STL/templates/RAII/smart pointers. Java: JVM/GC/generics/streams/concurrency. JavaScript: event loop/closures/async-await/prototype chain/Node.js. SQL: queries/joins/stored procedures/triggers/indexes. Also: Go, Rust, Kotlin, Swift, TypeScript, Haskell, assembly, bash. Compilers vs interpreters, JIT, LLVM.

6. COMPUTER ARCHITECTURE: Von Neumann/Harvard arch, fetch-decode-execute, CPU (ALU/CU/registers/PC/IR), ISA, RISC vs CISC, pipelining (hazards/forwarding/stalling), superscalar/OOO execution, branch prediction, cache (L1/L2/L3, direct-mapped/set-associative, write-back/write-through, coherence), memory hierarchy, virtual memory, TLB, DMA, interrupts, I/O methods. Number systems, two's complement, IEEE 754, Boolean algebra, logic gates, combinational/sequential circuits, flip-flops, FSM.

7. OPERATING SYSTEMS: kernel types, system calls, processes (PCB/states/context switching), threads, scheduling (FCFS/SJF/RR/priority/CFS), IPC (pipes/shared memory/sockets/signals), synchronization (mutex/semaphore/monitor/spinlock), deadlock (Banker's algorithm), memory management (paging/segmentation/page tables/replacement: FIFO/LRU/Optimal), virtual memory/demand paging, file systems (FAT/NTFS/ext4/inodes/journaling), disk scheduling (SSTF/SCAN/C-SCAN), booting, Linux commands, POSIX.

8. COMPUTER NETWORKS: OSI 7-layer model, TCP/IP 4-layer model. Physical: media/bandwidth/latency/encoding. Data Link: MAC/framing/CRC/flow control/CSMA/switches/VLANs/Ethernet/Wi-Fi. Network: IPv4/IPv6/subnetting/CIDR/NAT/routing (RIP/OSPF/BGP)/ICMP/ARP. Transport: TCP (3-way handshake/flow control/congestion control/AIMD)/UDP/ports/sockets. Application: HTTP/HTTPS/DNS/DHCP/FTP/SMTP/SSH/WebSockets. Devices: hub/switch/router/firewall/load balancer. Security: VPN/TLS/IPSec. Socket programming, ping/traceroute/Wireshark.

9. DATABASES: relational model, keys (primary/foreign/candidate), SQL (DDL/DML/DCL/TCL), joins (INNER/LEFT/RIGHT/FULL/CROSS/SELF), subqueries, CTEs, aggregate/window functions, views, stored procedures, triggers, indexes (B-tree/hash/clustered). Normalization (1NF-BCNF-5NF), functional dependencies, ACID properties, transactions, concurrency control (2PL/MVCC), isolation levels, deadlocks. Query optimization, execution plans. NoSQL (Redis/MongoDB/Cassandra/Neo4j), CAP theorem, BASE. ER diagrams, distributed databases (sharding/replication).

10. SOFTWARE ENGINEERING: SDLC (Waterfall/Agile/Scrum/Kanban/XP/Spiral), requirements engineering, use cases, user stories. Design patterns (Creational: Singleton/Factory/Builder; Structural: Adapter/Decorator/Facade/Proxy; Behavioral: Observer/Strategy/Command/Iterator/State). Architectural patterns (MVC/MVP/MVVM/microservices/event-driven). Testing (unit/integration/system/TDD/BDD/mocking/coverage). Git (branch/merge/rebase/cherry-pick), GitHub workflows, CI/CD, Docker, Kubernetes basics, Terraform. Clean code, refactoring, technical debt, semantic versioning.

11. CYBERSECURITY: CIA triad, AAA framework. Cryptography: symmetric (AES/DES)/asymmetric (RSA/ECC/Diffie-Hellman)/hashing (SHA-256/bcrypt)/digital signatures/PKI/TLS handshake. Network security: firewalls/IDS/IPS/VPN/Nmap/Wireshark. OWASP Top 10: SQL injection/XSS/CSRF/IDOR/XXE/SSRF/broken auth. System security: buffer overflow/privilege escalation/ASLR/DEP/stack canaries. Malware types, social engineering (phishing/pretexting). Penetration testing phases, tools (Metasploit/Burp Suite/SQLmap). CTF categories, ISO 27001/NIST/GDPR. Incident response lifecycle. CERTIFICATIONS: eCIR, CISSP, CEH, Security+, OSCP, GCIH, CompTIA, CISM, CISA, CRISC, CCNA, CCNP.

12. AI & MACHINE LEARNING: AI agents, PEAS, search (BFS/DFS/A*/minimax/alpha-beta/MCTS), CSP, knowledge representation (propositional/FOL/Bayesian networks). ML: supervised/unsupervised/reinforcement. Algorithms: linear regression/logistic regression/decision trees/random forests/XGBoost/SVM/k-NN/Naive Bayes/k-means/DBSCAN/PCA/t-SNE. Evaluation: cross-validation/confusion matrix/precision/recall/F1/ROC-AUC/bias-variance/regularization (L1/L2/dropout). Deep learning: perceptron/MLP/activations (ReLU/sigmoid/softmax)/backprop/optimizers (SGD/Adam)/CNN (LeNet/ResNet/VGG)/RNN/LSTM/GRU/Transformer (self-attention/BERT/GPT)/embeddings/GANs/VAE/diffusion models/transfer learning/prompt engineering. MLOps, AI ethics, LIME/SHAP.

13. WEB DEVELOPMENT: HTML5 (semantic/forms/accessibility), CSS3 (flexbox/grid/animations/responsive/BEM), JavaScript (DOM/fetch/async-await/Web APIs), React (hooks/state/props/Redux)/Vue/Angular/TypeScript. Backend: HTTP cycle/REST API (methods/status codes/versioning/auth)/GraphQL/WebSockets/gRPC. Frameworks: Express/Django/Flask/FastAPI/Spring Boot. Auth: JWT/OAuth2/OpenID/sessions/RBAC. Databases in web: ORM/connection pooling/migrations. Web security: HTTPS/CORS/CSP/HSTS. Cloud: AWS/GCP/Azure basics/serverless/CDN/load balancing.

14. COMPETITIVE PROGRAMMING: problem-solving approach, constraints analysis. Core: two pointers/sliding window/prefix sums/binary search on answer/greedy/backtracking/DP (1D/2D/bitmask/optimization). Graph: shortest path/MST/SCC/bipartite/network flow (Ford-Fulkerson/max matching). Math: sieve/GCD/modular arithmetic/Euler/CRT/combinatorics/inclusion-exclusion/Catalan numbers/geometry (convex hull). Advanced DS: segment trees (lazy propagation)/Fenwick/sparse table/sqrt decomposition/HLD/persistent DS/DSU. String: KMP/Z-function/suffix array/suffix automaton/Aho-Corasick. Platforms: Codeforces/LeetCode/AtCoder/ICPC.

15. THEORY OF COMPUTATION: DFA/NFA/NFA-to-DFA conversion, regular expressions, pumping lemma (regular), DFA minimization, Myhill-Nerode. CFG, parse trees, ambiguity, CNF, PDA, pumping lemma (CFL), CYK. Turing machines, decidability, halting problem, reductions, Rice's theorem. Complexity: P/NP/NP-complete/NP-hard/PSPACE, Cook-Levin, SAT/3-SAT/Clique/Vertex Cover, approximation algorithms.

16. COMPILER DESIGN: lexical analysis (tokens/regex/DFA/flex), syntax analysis (CFG/parse trees/LL/LR parsers: SLR/CLR/LALR/recursive descent/yacc), semantic analysis (symbol table/type checking/scope), intermediate code (TAC/SSA), optimization (constant folding/dead code/loop opt/inlining), code generation (register allocation/instruction selection/calling conventions). Runtime: activation records/heap management/GC (mark-sweep/ref counting/generational)/dynamic linking. AST, LLVM IR, bytecode.

17. MATHEMATICS FOR CS: Discrete math: propositional/predicate logic, proof techniques (direct/contrapositive/contradiction/induction), set theory, relations, functions (injective/surjective/bijective), combinatorics (permutations/combinations/pigeonhole/inclusion-exclusion/generating functions/recurrence/master theorem), graph theory (paths/cycles/trees/planarity/coloring/Euler-Hamilton), number theory (GCD/primes/modular arithmetic/CRT/Fermat/Euler totient), Boolean algebra. Linear algebra: vectors/matrices/determinants/Gaussian elimination/eigenvalues/eigenvectors/vector spaces. Probability: conditional probability/Bayes/random variables/distributions (Bernoulli/Binomial/Poisson/Normal)/expectation/variance/CLT/Markov chains/information theory (entropy). Calculus for ML: derivatives/chain rule/partial derivatives/gradient/Jacobian/Hessian/gradient descent/Taylor series.

════════════════════════════════
REFUSAL RULES — BE VERY CONSERVATIVE
════════════════════════════════
Only refuse in these 3 exact cases:
1. CLEARLY OFF-TOPIC (no CS connection): "capital of France?", "cook pasta?", "who won the match?" → status: "off_topic", message: "⚠️ This question is outside the scope of this CS platform."
2. INAPPROPRIATE: insults/harassment/sexual content → status: "inappropriate", message: "🚫 Please rephrase respectfully."
3. HARMFUL: malware/cheating tools for malicious use → status: "harmful", message: "🚫 I cannot help with that request."

THESE ARE ALWAYS STATUS OK — NEVER REFUSE THEM:
- "what does X stand for" → ALWAYS ok if X could be a CS acronym
- "define X" / "what is X" / "explain X" where X is a CS term → ALWAYS ok
- Any question containing CS keywords → ALWAYS ok
- ANY cybersecurity or IT/CS certification → ALWAYS ok
If ANY doubt → answer as CS. Do not over-refuse.

════════════════════════════════
ANSWERING STYLE
════════════════════════════════
- Clear, accurate, student-friendly with real examples and analogies.
- hint1 = gentle nudge, hint2 = stronger direction, hint3 = near solution.
- Answer must be complete and self-contained.

════════════════════════════════
TAGS — CLASSIFY THE QUESTION
════════════════════════════════
You MUST only use tags from this EXACT list. Do NOT invent tags outside this list.
NEVER return an empty tags array — always pick at least one:
oop, data-structures, algorithms, operating-systems, Database, computer-networks,
software-engineering, programming-languages, math, linear-algebra,
theory-of-computation, computer-architecture, compiler-design, artificial-intelligence,
machine-learning, visual-computing, data-science, security, web-development,
mobile-development, distributed-systems, cloud-computing, devops, systems,
human-computer-interaction

════════════════════════════════
XAI — EXPLAINABILITY LAYER (NEW)
════════════════════════════════
For EVERY answer you give, you MUST also provide:

1. reasoning: 1-2 sentences explaining WHY you answered this way and what approach you used.
   Example: "I approached this as a graph traversal problem because the question mentions finding shortest path between nodes."

2. concepts_used: list of 2-4 core CS concepts your answer depends on.
   Example: ["BFS", "Queue", "Adjacency List"]

3. might_be_unclear: list of 1-3 terms in your answer that a beginner might not understand.
   These should be specific terms FROM your answer, not general topics.
   Example: ["adjacency list", "visited array"]

Keep all three fields concise and student-friendly.

════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY
════════════════════════════════
{
  "status": "ok" | "off_topic" | "inappropriate" | "harmful",
  "message": "",
  "hint1": "",
  "hint2": "",
  "hint3": "",
  "answer": "",
  "tags": ["tag1", "tag2"],
  "reasoning": "",
  "concepts_used": ["concept1", "concept2"],
  "might_be_unclear": ["term1", "term2"]
}
"""


# ── AI answer generation ──────────────────────────────────────────────────────
def generate_ai_answer(
    question: str,
    history: list = None,
    *,
    oai_client: OpenAI | None = None,
    model: str | None = None,
) -> dict:
    try:
        active_client = oai_client or client
        active_model = model or CHAT_MODEL
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            for msg in history[-10:]:
                role = msg.get("role", "user")
                if role in ("user", "assistant"):
                    messages.append({"role": role, "content": msg.get("content", "")})
        messages.append({"role": "user", "content": question})
        response = active_client.chat.completions.create(
            model=active_model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=messages,
        )
        data   = json.loads(response.choices[0].message.content)
        status = data.get("status", "ok")
        if status != "ok":
            return {"status": status, "message": data.get("message", "⚠️ This question cannot be answered.")}

        hints = data.get("hints")
        if not isinstance(hints, list):
            hints = [data.get("hint1", ""), data.get("hint2", ""), data.get("hint3", "")]
        EMPTY_HINT = "No hints needed — this answer is self-explanatory."
        hints = [h if (h and h.strip()) else EMPTY_HINT for h in hints[:3]]

        answer = data.get("answer", "").strip()
        if not answer:
            raise ValueError("Missing answer in AI response")

        # ── XAI fields (new — safe defaults if model skips them) ──────────
        reasoning        = data.get("reasoning", "").strip()
        concepts_used    = data.get("concepts_used", [])
        might_be_unclear = data.get("might_be_unclear", [])

        if not isinstance(concepts_used, list):
            concepts_used = []
        if not isinstance(might_be_unclear, list):
            might_be_unclear = []

        return {
            "status":           "ok",
            "answer":           answer,
            "hints":            hints,
            "tags":             data.get("tags", ["systems"]),
            # XAI
            "reasoning":        reasoning,
            "concepts_used":    concepts_used,
            "might_be_unclear": might_be_unclear,
        }
    except Exception as e:
        logger.error(f"[AI Generation Error] {e}")
        err = str(e).lower()
        if "401" in err or "invalid_api_key" in err or "incorrect api key" in err:
            return {
                "status": "error",
                "message": (
                    "Hassona cannot reach OpenAI — the API key on the tutor service is "
                    "invalid or expired. Update the openai-api-key secret on Azure "
                    "(nibras-chatbot-v1) and restart the app."
                ),
            }
        return {"status": "error", "message": "AI generation failed. Please retry."}


def _openai_key_ok() -> tuple[bool, str | None]:
    try:
        client.models.list()
        return True, None
    except Exception as e:
        return False, str(e)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    ok, err = _openai_key_ok()
    return jsonify({"ok": ok, "openai": "ok" if ok else "error", "detail": err}), 200 if ok else 503


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/ask", methods=["POST"])
@limiter.limit("30 per minute")
def ask():
    body     = request.get_json(silent=True) or {}
    question = body.get("question", "").strip()
    if not question:
        return jsonify({"error": "Question is required"}), 400

    if not is_cs_related(question):
        return jsonify({
            "type": "refused",
            "message": "⚠️ This question is outside the scope of this CS platform.",
        })

    history = body.get("history", [])
    oai_client, chat_model = openai_client_for_request(body)
    ai_response = generate_ai_answer(
        question,
        history=history,
        oai_client=oai_client,
        model=chat_model,
    )
    if ai_response["status"] == "error":
        return jsonify({"type": "error", "message": ai_response["message"]}), 503
    if ai_response["status"] != "ok":
        return jsonify({"type": "refused", "message": ai_response["message"]})

    ai_answer = ai_response["answer"]
    ai_hints  = ai_response["hints"]
    ai_tags   = correct_tags(question, ai_response["tags"])
    logger.info(f"[Tags] AI: {ai_response['tags']} → Corrected: {ai_tags}")

    # ── XAI fields ────────────────────────────────────────────────────────
    xai = {
        "reasoning":        ai_response.get("reasoning", ""),
        "concepts_used":    ai_response.get("concepts_used", []),
        "might_be_unclear": ai_response.get("might_be_unclear", []),
    }

    matched_q, match_score, matched_tag = tag_loop_semantic_search(question, ai_tags)
    if matched_q:
        return jsonify({
            "type": "community_match",
            "data": {
                "answer":        ai_answer,
                "hints":         ai_hints,
                "tags":          ai_tags,
                "match_method":  "tag+semantic",
                "match_score":   round(match_score, 3),
                "matched_tag":   matched_tag,
                "question_id":   matched_q["id"],
                "question":      matched_q["question_text"],
                "votesCount":    matched_q.get("votesCount", 0),
                "answersCount":  matched_q.get("answersCount", 0),
                # XAI
                "xai":           xai,
            },
        })

    return jsonify({
        "type": "generated",
        "data": {
            "question": question,
            "answer":   ai_answer,
            "hints":    ai_hints,
            "tags":     ai_tags,
            # XAI
            "xai":      xai,
        },
    })


@app.route("/api/answer-question", methods=["POST"])
@limiter.limit("20 per minute")
def answer_question():
    body        = request.get_json(silent=True) or {}
    question_id = body.get("id", "").strip()
    question    = body.get("question", "").strip()
    if not question_id or not question:
        return jsonify({"error": "id and question required"}), 400

    ai = generate_ai_answer(question)
    if ai["status"] == "error":
        return jsonify({"type": "error", "message": ai["message"]}), 503
    if ai["status"] != "ok":
        return jsonify({"type": "refused", "message": ai["message"]})

    ai["tags"] = correct_tags(question, ai["tags"])
    posted     = post_answer_to_railway(question_id, ai["answer"])
    return jsonify({"type": "answered", "posted": posted, "data": ai})


@app.route("/api/generate-for-matched", methods=["POST"])
@limiter.limit("20 per minute")
def generate_for_matched():
    question = (request.get_json(silent=True) or {}).get("question", "").strip()
    if not question:
        return jsonify({"error": "question required"}), 400

    ai = generate_ai_answer(question)
    if ai["status"] == "ok":
        ai["tags"] = correct_tags(question, ai["tags"])
        return jsonify({"type": "generated", "data": ai})
    if ai["status"] == "error":
        return jsonify({"type": "error", "message": ai["message"]}), 503
    return jsonify({"type": "refused", "message": ai["message"]})


# ── NEW: XAI explain endpoint ─────────────────────────────────────────────────
@app.route("/api/explain", methods=["POST"])
@limiter.limit("30 per minute")
def explain():
    """
    Takes a term the student doesn't understand + the original question context,
    returns a simple focused explanation without touching any existing logic.

    Request body:
        { "term": "adjacency list", "context": "original question text" }

    Response:
        { "term": "...", "explanation": "...", "example": "...", "related": [...] }
    """
    body    = request.get_json(silent=True) or {}
    term    = body.get("term", "").strip()
    context = body.get("context", "").strip()

    if not term:
        return jsonify({"error": "term is required"}), 400

    explain_prompt = f"""
You are a CS tutor. A student is reading an answer about: "{context}"
They don't understand the term: "{term}"

Reply ONLY with valid JSON in this exact format:
{{
  "term": "{term}",
  "explanation": "1-2 simple sentences explaining the term for a beginner",
  "example": "a short concrete example (code snippet or real-world analogy)",
  "related": ["related_term1", "related_term2"]
}}
"""
    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": explain_prompt}],
        )
        data = json.loads(response.choices[0].message.content)
        return jsonify(data)
    except Exception as e:
        logger.error(f"[Explain Error] {e}")
        return jsonify({"error": "Could not generate explanation. Please retry."}), 500


# ── Insights endpoint ────────────────────────────────────────────────────────
@app.route("/api/insights", methods=["POST"])
@limiter.limit("10 per minute")
def insights():
    body  = request.get_json(silent=True) or {}
    stats = body.get("stats", {})
    top_tags = stats.get("topTags", [])

    if not top_tags:
        return jsonify({
            "hardMetrics": stats,
            "aiSummary": {
                "strengths": [],
                "weaknesses": [],
                "nextActions": ["Ask the AI Tutor some questions to start building your learning profile."],
                "overallAssessment": "Not enough data yet. Keep asking questions!",
            },
        })

    tag_summary = ", ".join(f"{t['tag']} ({t['count']})" for t in top_tags[:15])
    prompt = f"""You are analysing a CS student's question history on an AI tutoring platform.

Topic distribution (tag: question count): {tag_summary}
Total questions asked: {stats.get('totalQuestions', 0)}
Streak days: {stats.get('streakDays', 0)}

Based on this data, generate a learning assessment. Reply ONLY with valid JSON:
{{
  "strengths": [{{"topic": "...", "score": 0.0-1.0}}, ...],
  "weaknesses": [{{"topic": "...", "score": 0.0-1.0}}, ...],
  "nextActions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "overallAssessment": "1-2 sentence summary of the student's learning profile"
}}

Rules:
- strengths = topics the student asks about most (they're engaging deeply)
- weaknesses = important CS topics they HAVEN'T asked about (gaps in coverage)
- scores are relative confidence levels (0.0-1.0)
- limit to 5 strengths and 5 weaknesses max
- nextActions should be specific and actionable"""

    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        ai_summary = json.loads(response.choices[0].message.content)
        return jsonify({"hardMetrics": stats, "aiSummary": ai_summary})
    except Exception as e:
        logger.error(f"[Insights Error] {e}")
        return jsonify({
            "hardMetrics": stats,
            "aiSummary": {
                "strengths": [],
                "weaknesses": [],
                "nextActions": ["Could not generate AI summary. Try again later."],
                "overallAssessment": "Analysis unavailable.",
            },
        })


# ── Routing endpoint ─────────────────────────────────────────────────────────
@app.route("/api/routing", methods=["POST"])
@limiter.limit("10 per minute")
def routing():
    body = request.get_json(silent=True) or {}
    goal = body.get("goal", "").strip()
    if not goal:
        return jsonify({"error": "goal is required"}), 400

    prompt = f"""You are a CS learning path planner. A student has this goal:
"{goal}"

Create a step-by-step study plan. Reply ONLY with valid JSON:
{{
  "goal": "{goal}",
  "summary": "1-2 sentence overview of the plan",
  "steps": [
    {{
      "id": "step_1",
      "title": "short step title",
      "description": "what to study and why",
      "estimatedMinutes": 30,
      "ready": true,
      "topics": ["topic1", "topic2"],
      "resourceUrl": null
    }}
  ]
}}

Rules:
- 4-8 steps, ordered by prerequisite dependency
- First steps should be "ready": true (no prerequisites)
- Later steps that depend on earlier ones should be "ready": false
- estimatedMinutes should be realistic (15-120 range)
- topics should use standard CS terminology
- resourceUrl can be null (the platform will fill these in later)"""

    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(response.choices[0].message.content)
        return jsonify(data)
    except Exception as e:
        logger.error(f"[Routing Error] {e}")
        return jsonify({"error": "Could not generate learning path. Please retry."}), 500


@app.route("/api/community")
def community():
    return jsonify(fetch_questions())


@app.route("/api/stats")
def stats():
    qs = fetch_questions()
    return jsonify({
        "total_questions": len(qs),
        "with_answers":    sum(1 for q in qs if q["answersCount"] > 0),
    })


@app.route("/api/admin/cleanup-cache", methods=["POST"])
def cleanup_cache():
    qs        = fetch_questions()
    valid_ids = [q["id"] for q in qs]
    cache_cleanup(valid_ids)
    return jsonify({"status": "ok", "valid_ids_count": len(valid_ids)})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ != "__main__":
    application = app   # required for Gunicorn / Render / Heroku

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
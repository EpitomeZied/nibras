import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type WelcomeEmailProps = {
  name: string;
  dashboardUrl: string;
  docsUrl: string;
};

export function WelcomeEmail({ name, dashboardUrl, docsUrl }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Nibras</Preview>
      <Body style={main}>
        <Container style={card}>
          <Heading style={heading}>Welcome to Nibras</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Your account is ready. Open the dashboard to explore courses, projects, and your
            academic workspace.
          </Text>
          <Section style={buttonWrap}>
            <Button href={dashboardUrl} style={button}>
              Open dashboard
            </Button>
          </Section>
          <Text style={text}>
            New here? Read the <Link href={docsUrl}>documentation</Link> for setup steps and FAQ.
          </Text>
          <Text style={muted}>
            To submit coding projects from the terminal, install the CLI and connect GitHub when
            you are ready.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '32px 16px',
};

const card = {
  backgroundColor: '#111827',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '480px',
  margin: '0 auto',
  border: '1px solid rgba(255,255,255,0.08)',
};

const heading = {
  color: '#fafafa',
  fontSize: '22px',
  fontWeight: '700' as const,
  margin: '0 0 16px',
};

const text = {
  color: '#d4d4d8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const buttonWrap = {
  margin: '0 0 20px',
};

const button = {
  backgroundColor: '#22c55e',
  color: '#0a0a0a',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
};

const muted = {
  color: '#a1a1aa',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
};

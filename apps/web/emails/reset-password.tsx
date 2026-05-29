import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type ResetPasswordEmailProps = {
  url: string;
};

export function ResetPasswordEmail({ url }: ResetPasswordEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your Nibras password</Preview>
      <Body style={main}>
        <Container style={card}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={text}>
            Click the button below to set a new password for your Nibras account. This link
            expires in one hour.
          </Text>
          <Section style={buttonWrap}>
            <Button href={url} style={button}>
              Reset password
            </Button>
          </Section>
          <Text style={muted}>
            If you did not request a password reset, you can ignore this email. Your password will
            not change.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

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
  margin: '0 0 24px',
};

const buttonWrap = {
  margin: '0 0 24px',
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

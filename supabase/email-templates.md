# Orderly Email Templates

This document contains the HTML email templates for Supabase Auth emails, branded for Orderly - your AI legal research platform.

## Design Notes

- **Brand Colors**: Blue theme (approximately #4A6CF7 for primary actions)
- **Tone**: Professional, clear, and trustworthy - appropriate for legal professionals
- **Layout**: Clean, minimal, mobile-responsive

## Template Configuration Instructions

To apply these templates in Supabase:

1. Go to your Supabase Dashboard → Authentication → Email Templates
2. Copy the HTML content for each template type
3. Update the `{{ .SiteURL }}` variable if needed (configured in Authentication settings)

---

## 1. Confirm Signup

**Subject**: `Confirm your Orderly account`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm your account</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  Welcome to Orderly
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  Thank you for signing up! To complete your registration and
                  start using Orderly to enhance your legal research, please
                  confirm your email address.
                </p>

                <!-- CTA Button -->
                <table role="presentation" style="width: 100%; margin: 32px 0;">
                  <tr>
                    <td style="text-align: center;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 32px; background-color: #4A6CF7; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;"
                        >Confirm Email Address</a
                      >
                    </td>
                  </tr>
                </table>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  Or copy and paste this link into your browser:<br />
                  <a
                    href="{{ .ConfirmationURL }}"
                    style="color: #4A6CF7; word-break: break-all;"
                    >{{ .ConfirmationURL }}</a
                  >
                </p>

                <p
                  style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #94a3b8;"
                >
                  This link will expire in 24 hours. If you didn't create an
                  Orderly account, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 2. Magic Link

**Subject**: `Your Orderly sign-in link`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sign in to Orderly</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  Sign in to Orderly
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  Click the link below to securely sign in to your Orderly
                  account. This link will expire in 1 hour.
                </p>

                <!-- CTA Button -->
                <table role="presentation" style="width: 100%; margin: 32px 0;">
                  <tr>
                    <td style="text-align: center;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 32px; background-color: #4A6CF7; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;"
                        >Sign In</a
                      >
                    </td>
                  </tr>
                </table>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  Or copy and paste this link into your browser:<br />
                  <a
                    href="{{ .ConfirmationURL }}"
                    style="color: #4A6CF7; word-break: break-all;"
                    >{{ .ConfirmationURL }}</a
                  >
                </p>

                <p
                  style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #94a3b8;"
                >
                  If you didn't request this sign-in link, you can safely ignore
                  this email. Your account remains secure.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 3. Reset Password

**Subject**: `Reset your Orderly password`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your password</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  Reset Your Password
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  We received a request to reset the password for your Orderly
                  account. Click the button below to create a new password.
                </p>

                <!-- CTA Button -->
                <table role="presentation" style="width: 100%; margin: 32px 0;">
                  <tr>
                    <td style="text-align: center;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 32px; background-color: #4A6CF7; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;"
                        >Reset Password</a
                      >
                    </td>
                  </tr>
                </table>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  Or copy and paste this link into your browser:<br />
                  <a
                    href="{{ .ConfirmationURL }}"
                    style="color: #4A6CF7; word-break: break-all;"
                    >{{ .ConfirmationURL }}</a
                  >
                </p>

                <p
                  style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #94a3b8;"
                >
                  <strong>This link will expire in 1 hour.</strong> If you
                  didn't request a password reset, you can safely ignore this
                  email. Your password will remain unchanged.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 4. Invite User

**Subject**: `You've been invited to Orderly`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You've been invited</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  You've been invited
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  You have been invited to join Orderly, the AI-powered legal
                  research platform. Click the link below to accept the
                  invitation and create your account.
                </p>

                <!-- CTA Button -->
                <table role="presentation" style="width: 100%; margin: 32px 0;">
                  <tr>
                    <td style="text-align: center;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 32px; background-color: #4A6CF7; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;"
                        >Accept Invitation</a
                      >
                    </td>
                  </tr>
                </table>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  Or copy and paste this link into your browser:<br />
                  <a
                    href="{{ .ConfirmationURL }}"
                    style="color: #4A6CF7; word-break: break-all;"
                    >{{ .ConfirmationURL }}</a
                  >
                </p>

                <p
                  style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #94a3b8;"
                >
                  This invitation link will expire in 7 days. If you believe you
                  received this email in error, you can safely ignore it.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 5. Change Email Address

**Subject**: `Confirm your new email address`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm email change</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  Confirm Email Change
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  You've requested to change your email address to
                  <strong>{{ .NewEmail }}</strong>. Click the button below to
                  confirm this change.
                </p>

                <!-- CTA Button -->
                <table role="presentation" style="width: 100%; margin: 32px 0;">
                  <tr>
                    <td style="text-align: center;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 32px; background-color: #4A6CF7; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;"
                        >Confirm Email Change</a
                      >
                    </td>
                  </tr>
                </table>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  Or copy and paste this link into your browser:<br />
                  <a
                    href="{{ .ConfirmationURL }}"
                    style="color: #4A6CF7; word-break: break-all;"
                    >{{ .ConfirmationURL }}</a
                  >
                </p>

                <p
                  style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #94a3b8;"
                >
                  If you didn't request this change, please contact support
                  immediately to secure your account.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 6. Reauthentication (OTP)

**Subject**: `Your Orderly verification code`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification code</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  Verification Code
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  To complete this action, please enter the following
                  verification code:
                </p>

                <!-- OTP Code Display -->
                <table role="presentation" style="width: 100%; margin: 32px 0;">
                  <tr>
                    <td style="text-align: center;">
                      <div
                        style="display: inline-block; padding: 20px 40px; background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px;"
                      >
                        <span
                          style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #1e293b; font-family: 'Courier New', monospace;"
                          >{{ .Token }}</span
                        >
                      </div>
                    </td>
                  </tr>
                </table>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  This code will expire in 10 minutes. If you didn't request
                  this code, you can safely ignore this email.
                </p>

                <p
                  style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; line-height: 1.6; color: #94a3b8;"
                >
                  For security reasons, never share this code with anyone.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 7. Password Changed Notification

**Subject**: `Your Orderly password has been changed`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password changed</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  Password Changed
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  This is a confirmation that the password for your Orderly
                  account ({{ .Email }}) has just been changed.
                </p>

                <div
                  style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 24px 0;"
                >
                  <p
                    style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;"
                  >
                    <strong>Didn't make this change?</strong><br />
                    If you didn't change your password, please contact support
                    immediately to secure your account.
                  </p>
                </div>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  If you made this change, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 8. Email Changed Notification

**Subject**: `Your Orderly email address has been changed`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email changed</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <table
            role="presentation"
            style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;"
              >
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;"
                >
                  Orderly
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  AI Legal Research Platform
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b;"
                >
                  Email Address Changed
                </h2>
                <p
                  style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;"
                >
                  The email address for your Orderly account has been changed
                  from <strong>{{ .OldEmail }}</strong> to
                  <strong>{{ .Email }}</strong>.
                </p>

                <div
                  style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 24px 0;"
                >
                  <p
                    style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;"
                  >
                    <strong>Didn't make this change?</strong><br />
                    If you didn't change your email address, please contact
                    support immediately to secure your account.
                  </p>
                </div>

                <p
                  style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;"
                >
                  If you made this change, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;"
              >
                <p
                  style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;"
                >
                  © 2025 Orderly. All rights reserved.<br />
                  <a
                    href="{{ .SiteURL }}"
                    style="color: #4A6CF7; text-decoration: none;"
                    >Visit Orderly</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## Quick Setup Script

To update all templates at once via the Supabase Management API, you can use this script (requires your access token and project ref):

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "mailer_subjects_confirmation": "Confirm your Orderly account",
  "mailer_templates_confirmation_content": "[PASTE HTML FROM SECTION 1]",
  "mailer_subjects_magic_link": "Your Orderly sign-in link",
  "mailer_templates_magic_link_content": "[PASTE HTML FROM SECTION 2]",
  "mailer_subjects_recovery": "Reset your Orderly password",
  "mailer_templates_recovery_content": "[PASTE HTML FROM SECTION 3]",
  "mailer_subjects_invite": "You've been invited to Orderly",
  "mailer_templates_invite_content": "[PASTE HTML FROM SECTION 4]",
  "mailer_subjects_email_change": "Confirm your new email address",
  "mailer_templates_email_change_content": "[PASTE HTML FROM SECTION 5]",
  "mailer_subjects_reauthentication": "Your Orderly verification code",
  "mailer_templates_reauthentication_content": "[PASTE HTML FROM SECTION 6]",
  "mailer_notifications_password_changed_enabled": true,
  "mailer_subjects_password_changed_notification": "Your Orderly password has been changed",
  "mailer_templates_password_changed_notification_content": "[PASTE HTML FROM SECTION 7]",
  "mailer_notifications_email_changed_enabled": true,
  "mailer_subjects_email_changed_notification": "Your Orderly email address has been changed",
  "mailer_templates_email_changed_notification_content": "[PASTE HTML FROM SECTION 8]"
}
EOF
```

Note: Replace `[PASTE HTML FROM SECTION X]` with the actual HTML content, properly escaped as a JSON string.

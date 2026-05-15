package com.skillswap.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends transactional email. In production set MAIL_HOST + MAIL_USERNAME + MAIL_PASSWORD
 * so a JavaMailSender bean is auto-configured. When unset, we log to stdout so local dev
 * doesn't require an SMTP server — useful for the OTP flow.
 */
@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@skillswap.local}")
    private String fromAddress;

    // Spring auto-configures a JavaMailSender even when host is blank, so we read the
    // raw property and treat blank as "no mailer".
    @Value("${spring.mail.host:}")
    private String mailHost;

    public void sendOtpEmail(String toEmail, String code, int validMinutes) {
        String subject = "Your SkillSwap verification code";
        String body = "Your SkillSwap verification code is: " + code + "\n\n"
                + "It expires in " + validMinutes + " minutes. If you didn't request this, ignore this email.";
        send(toEmail, subject, body);
    }

    public void sendAccountExistsEmail(String toEmail) {
        String subject = "Someone tried to sign up with your email";
        String body = "We received a sign-up attempt with this email, but an account already exists. "
                + "If that was you, please use the sign-in page instead. "
                + "If it wasn't, you can safely ignore this message.";
        send(toEmail, subject, body);
    }

    private void send(String to, String subject, String body) {
        if (mailSender == null || mailHost == null || mailHost.isBlank()) {
            log.info("[email/dev-fallback] to={} subject=\"{}\"\n{}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Sent email to {}: {}", to, subject);
        } catch (Exception e) {
            // Don't throw — that would roll back a valid OTP challenge. Instead log the full
            // body so the code is still recoverable from the server log while SMTP is broken.
            log.error("Failed to send email to {} ({}). Falling back to log:\nsubject=\"{}\"\n{}",
                    to, e.getMessage(), subject, body);
        }
    }
}

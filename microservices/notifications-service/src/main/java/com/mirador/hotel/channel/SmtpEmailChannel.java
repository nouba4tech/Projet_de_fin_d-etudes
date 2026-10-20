package com.mirador.hotel.channel;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/** Real e-mail delivery, enabled with {@code notifications.smtp.enabled=true} plus the usual {@code spring.mail.*}. */
@Component
@ConditionalOnProperty(name = "notifications.smtp.enabled", havingValue = "true")
public class SmtpEmailChannel implements DeliveryChannel {

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpEmailChannel(JavaMailSender mailSender,
                            @Value("${notifications.smtp.from:no-reply@mirador-hotel.cm}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public String channel() {
        return "EMAIL";
    }

    public void deliver(String recipient, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}

package com.mirador.hotel.channel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Default delivery: the message is logged and stored but NOT sent anywhere. Real e-mail is available through
 * {@link SmtpEmailChannel}; for SMS, implement {@link DeliveryChannel} with your provider's API.
 */
public final class SimulatedChannels {

    private SimulatedChannels() {
    }

    @Component
    @ConditionalOnProperty(name = "notifications.smtp.enabled", havingValue = "false", matchIfMissing = true)
    public static class SimulatedEmail implements DeliveryChannel {
        private static final Logger log = LoggerFactory.getLogger(SimulatedEmail.class);

        public String channel() {
            return "EMAIL";
        }

        public void deliver(String recipient, String subject, String body) {
            log.info("[EMAIL simule] a={} objet='{}'", recipient, subject);
        }
    }

    @Component
    public static class SimulatedSms implements DeliveryChannel {
        private static final Logger log = LoggerFactory.getLogger(SimulatedSms.class);

        public String channel() {
            return "SMS";
        }

        public void deliver(String recipient, String subject, String body) {
            log.info("[SMS simule] a={} texte='{}'", recipient, body);
        }
    }
}

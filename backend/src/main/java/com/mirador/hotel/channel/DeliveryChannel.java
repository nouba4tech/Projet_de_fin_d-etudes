package com.mirador.hotel.channel;

/** A way to deliver a message (e-mail, SMS...). Implement it to plug a real provider. */
public interface DeliveryChannel {

    /** "EMAIL" or "SMS". */
    String channel();

    void deliver(String recipient, String subject, String body) throws Exception;
}

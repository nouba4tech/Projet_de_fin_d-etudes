package com.mirador.hotel.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM for the identity documents stored in the database. Stored form: 12-byte IV followed by the ciphertext
 * (with its tag). The key comes from identity.encryption-key (base64, 32 bytes); without it, it is derived from the
 * JWT secret, so changing that secret makes the stored documents unreadable.
 */
@Component
public class DocumentCipher {

    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public DocumentCipher(@Value("${identity.encryption-key:}") String configuredKey,
                          @Value("${jwt.secret:default-secret-please-change}") String jwtSecret) {
        this.key = new SecretKeySpec(resolveKey(configuredKey, jwtSecret), "AES");
    }

    private static byte[] resolveKey(String configuredKey, String jwtSecret) {
        if (configuredKey != null && !configuredKey.isBlank()) {
            byte[] decoded = Base64.getDecoder().decode(configuredKey.trim());
            if (decoded.length != 32) {
                throw new IllegalStateException("identity.encryption-key doit faire 32 octets (base64).");
            }
            return decoded;
        }
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(("mirador-identity-documents|" + jwtSecret).getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    public byte[] encrypt(byte[] plain) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] sealed = cipher.doFinal(plain);
            return ByteBuffer.allocate(iv.length + sealed.length).put(iv).put(sealed).array();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Chiffrement du document impossible.", e);
        }
    }

    public byte[] decrypt(byte[] stored) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, stored, 0, IV_LENGTH));
            return cipher.doFinal(stored, IV_LENGTH, stored.length - IV_LENGTH);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Dechiffrement du document impossible.", e);
        }
    }
}

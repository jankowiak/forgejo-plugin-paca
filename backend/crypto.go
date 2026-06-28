package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
)

func encryptAES(plaintext, hexKey string) (string, error) {
	key, err := hex.DecodeString(hexKey)
	if err != nil {
		return "", fmt.Errorf("crypto: decode key: %w", err)
	}
	if len(key) != 32 {
		return "", errors.New("crypto: encryption key must be 32 bytes (64 hex chars)")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: new cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: new gcm: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("crypto: generate nonce: %w", err)
	}

	sealed := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(sealed), nil
}

func decryptAES(cipherHex, hexKey string) (string, error) {
	key, err := hex.DecodeString(hexKey)
	if err != nil {
		return "", fmt.Errorf("crypto: decode key: %w", err)
	}
	if len(key) != 32 {
		return "", errors.New("crypto: encryption key must be 32 bytes (64 hex chars)")
	}

	data, err := hex.DecodeString(cipherHex)
	if err != nil {
		return "", fmt.Errorf("crypto: decode ciphertext: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: new cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: new gcm: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("crypto: ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("crypto: decrypt: %w", err)
	}
	return string(plaintext), nil
}

func (p *forgejoPlugin) encryptionKey() (string, error) {
	key, ok := p.cfg.Get("ENCRYPTION_KEY")
	if !ok || key == "" {
		return "", errors.New("ENCRYPTION_KEY not configured")
	}
	return key, nil
}

func (p *forgejoPlugin) encrypt(plaintext string) (string, error) {
	key, err := p.encryptionKey()
	if err != nil {
		return "", err
	}
	return encryptAES(plaintext, key)
}

func (p *forgejoPlugin) decrypt(ciphertext string) (string, error) {
	key, err := p.encryptionKey()
	if err != nil {
		return "", err
	}
	return decryptAES(ciphertext, key)
}

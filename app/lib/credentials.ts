import prisma from './prisma';
import crypto from 'crypto';

// Encryption key should be stored in environment variables
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-key-change-in-production';

// Generate a proper key and IV from the encryption key
function generateKeyAndIV(password: string) {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  const key = hash.digest();
  
  const ivHash = crypto.createHash('md5');
  ivHash.update(password);
  const iv = ivHash.digest();
  
  return { key, iv };
}

export interface CredentialConfig {
  [key: string]: any;
}

export interface CreateCredentialData {
  userId: string;
  organizationId?: string;
  provider: string;
  name: string;
  config: CredentialConfig;
}

export interface UpdateCredentialData {
  name?: string;
  config?: CredentialConfig;
  isActive?: boolean;
}

export class CredentialService {
  private encryptConfig(config: CredentialConfig): string {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'default-key-change-in-production') {
      console.warn('Using default encryption key. Please set CREDENTIAL_ENCRYPTION_KEY environment variable in production.');
    }
    
    try {
      const configString = JSON.stringify(config);
      const { key, iv } = generateKeyAndIV(ENCRYPTION_KEY);
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(configString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data for decryption
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt credential configuration');
    }
  }

  private decryptConfig(encryptedConfig: string): CredentialConfig {
    try {
      const { key, iv } = generateKeyAndIV(ENCRYPTION_KEY);
      
      // Split IV and encrypted data
      const parts = encryptedConfig.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const encryptedData = parts[1];
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt credential configuration');
    }
  }

  async createCredential(data: CreateCredentialData) {
    try {
      console.log('Creating credential with data:', { ...data, config: '[REDACTED]' });
      
      // Validate input data
      if (!data.userId || !data.provider || !data.name || !data.config) {
        throw new Error('Missing required fields: userId, provider, name, config');
      }

      if (typeof data.config !== 'object' || data.config === null) {
        throw new Error('Config must be a valid object');
      }

      const encryptedConfig = this.encryptConfig(data.config);
      console.log('Config encrypted successfully');
      
      const credential = await prisma.integrationCredential.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId,
          provider: data.provider,
          name: data.name,
          config: { encrypted: encryptedConfig },
          isActive: true,
        },
      });

      console.log('Credential created in database:', credential.id);

      // Log the creation
      await prisma.integrationLog.create({
        data: {
          credentialId: credential.id,
          operation: 'create',
          status: 'success',
          details: { provider: data.provider, name: data.name },
        },
      });

      console.log('Integration log created successfully');
      return credential;
      
    } catch (error) {
      console.error('Error in createCredential:', error);
      
      // Log the error to integration log if we have a credential ID
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          data: { ...data, config: '[REDACTED]' }
        });
      }
      
      throw error;
    }
  }

  async updateCredential(id: string, data: UpdateCredentialData) {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.config !== undefined) {
      updateData.config = { encrypted: this.encryptConfig(data.config) };
    }

    const credential = await prisma.integrationCredential.update({
      where: { id },
      data: updateData,
    });

    // Log the update
    await prisma.integrationLog.create({
      data: {
        credentialId: credential.id,
        operation: 'update',
        status: 'success',
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    return credential;
  }

  async deleteCredential(id: string) {
    const credential = await prisma.integrationCredential.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.integrationLog.create({
      data: {
        credentialId: id,
        operation: 'delete',
        status: 'success',
        details: { provider: credential.provider, name: credential.name },
      },
    });

    return credential;
  }

  async getCredential(id: string) {
    const credential = await prisma.integrationCredential.findUnique({
      where: { id },
    });

    if (!credential) return null;

    // Decrypt the config
    const decryptedConfig = this.decryptConfig(credential.config.encrypted);
    
    return {
      ...credential,
      config: decryptedConfig,
    };
  }

  async getCredentialsByUser(userId: string, organizationId?: string) {
    const credentials = await prisma.integrationCredential.findMany({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt all configs
    return credentials.map(credential => ({
      ...credential,
      config: this.decryptConfig(credential.config.encrypted),
    }));
  }

  async getCredentialsByProvider(userId: string, provider: string, organizationId?: string) {
    const credentials = await prisma.integrationCredential.findMany({
      where: {
        userId,
        provider,
        organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt all configs
    return credentials.map(credential => ({
      ...credential,
      config: this.decryptConfig(credential.config.encrypted),
    }));
  }

  async testCredential(id: string) {
    const credential = await this.getCredential(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    try {
      // Test the credential based on provider
      switch (credential.provider) {
        case 'slack':
          return await this.testSlackCredential(credential.config);
        case 'google_sheets':
          return await this.testGoogleSheetsCredential(credential.config);
        case 'email':
          return await this.testEmailCredential(credential.config);
        default:
          throw new Error(`Unsupported provider: ${credential.provider}`);
      }
    } catch (error) {
      // Log the test failure
      await prisma.integrationLog.create({
        data: {
          credentialId: id,
          operation: 'test',
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }

    // Log the successful test
    await prisma.integrationLog.create({
      data: {
        credentialId: id,
        operation: 'test',
        status: 'success',
        details: { provider: credential.provider },
      },
    });

    return { success: true, message: 'Credential test successful' };
  }

  private async testSlackCredential(config: CredentialConfig) {
    const { botToken } = config;
    if (!botToken) {
      throw new Error('Slack bot token is required');
    }

    // Test the Slack API by getting auth info
    const response = await fetch('https://slack.com/api/auth.test', {
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return { success: true, team: result.team, user: result.user };
  }

  private async testGoogleSheetsCredential(config: CredentialConfig) {
    // This would test Google Sheets API credentials
    // For now, just validate the config structure
    const { clientEmail, privateKey, projectId } = config;
    
    if (!clientEmail || !privateKey || !projectId) {
      throw new Error('Google Sheets credentials are incomplete');
    }

    return { success: true, message: 'Google Sheets credentials validated' };
  }

  private async testEmailCredential(config: CredentialConfig) {
    // This would test email credentials
    // For now, just validate the config structure
    const { host, port, username, password } = config;
    
    if (!host || !port || !username || !password) {
      throw new Error('Email credentials are incomplete');
    }

    return { success: true, message: 'Email credentials validated' };
  }
}

export const credentialService = new CredentialService();

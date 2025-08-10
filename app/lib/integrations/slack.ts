import { credentialService } from '../credentials';

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
}

export interface SlackFileUpload {
  channel: string;
  file: Buffer | string;
  filename: string;
  title?: string;
  initial_comment?: string;
  thread_ts?: string;
}

export interface SlackChannelInfo {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  num_members: number;
  purpose?: {
    value: string;
  };
}

export interface SlackUserInfo {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
  };
}

export class SlackService {
  private async getCredential(credentialId: string) {
    const credential = await credentialService.getCredential(credentialId);
    if (!credential || credential.provider !== 'slack') {
      throw new Error('Invalid Slack credential');
    }
    return credential;
  }

  private async makeSlackRequest(endpoint: string, token: string, method: string = 'GET', body?: any) {
    const url = `https://slack.com/api/${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    console.log(`Making Slack API request to ${endpoint}:`, {
      url,
      method,
      hasBody: !!body,
      bodyKeys: body ? Object.keys(body) : [],
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'none'
    });

    const response = await fetch(url, options);
    const result = await response.json();

    console.log(`Slack API response from ${endpoint}:`, {
      status: response.status,
      ok: response.ok,
      result: result
    });

    if (!result.ok) {
      const errorMessage = result.error || 'Unknown Slack API error';
      const errorDetails = {
        endpoint,
        status: response.status,
        slackError: errorMessage,
        response: result,
        requestBody: body
      };
      
      console.error('Slack API error details:', errorDetails);
      
      // Provide more specific error messages for common issues
      let userFriendlyError = `Slack API error: ${errorMessage}`;
      
      switch (errorMessage) {
        case 'channel_not_found':
          userFriendlyError = 'Channel not found. Make sure the channel exists and the bot is a member.';
          break;
        case 'not_in_channel':
          userFriendlyError = 'Bot is not in this channel. Please invite the bot to the channel first.';
          break;
        case 'invalid_auth':
          userFriendlyError = 'Invalid authentication. Please check your bot token.';
          break;
        case 'token_revoked':
          userFriendlyError = 'Bot token has been revoked. Please regenerate your bot token.';
          break;
        case 'insufficient_scope':
          userFriendlyError = 'Bot lacks required permissions. Please check your OAuth scopes.';
          break;
      }
      
      throw new Error(userFriendlyError);
    }

    return result;
  }

  async sendMessage(credentialId: string, message: SlackMessage) {
    try {
      const credential = await this.getCredential(credentialId);
      const { botToken } = credential.config;

      // Validate and format the channel
      let formattedChannel = message.channel;
      
      // Remove # if present (Slack API expects channel name without #)
      if (formattedChannel.startsWith('#')) {
        formattedChannel = formattedChannel.substring(1);
      }
      
      // Remove @ if present (for DMs, Slack expects user ID)
      if (formattedChannel.startsWith('@')) {
        formattedChannel = formattedChannel.substring(1);
      }

      const formattedMessage = {
        ...message,
        channel: formattedChannel,
        // Ensure text is present
        text: message.text || 'No message content provided'
      };

      console.log('Sending Slack message:', {
        credentialId,
        originalChannel: message.channel,
        formattedChannel,
        message: formattedMessage,
        hasToken: !!botToken,
        tokenPrefix: botToken ? botToken.substring(0, 10) + '...' : 'none'
      });

      const result = await this.makeSlackRequest('chat.postMessage', botToken, 'POST', formattedMessage);
      
      console.log('Slack message sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to send Slack message:', {
        credentialId,
        channel: message.channel,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async sendMessageToThread(credentialId: string, channel: string, threadTs: string, text: string) {
    return await this.sendMessage(credentialId, {
      channel,
      text,
      thread_ts: threadTs,
    });
  }

  async uploadFile(credentialId: string, fileUpload: SlackFileUpload) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    // For file uploads, we need to use form data
    const formData = new FormData();
    formData.append('token', botToken);
    formData.append('channels', fileUpload.channel);
    
    // Handle both Buffer and string file types
    if (typeof fileUpload.file === 'string') {
      formData.append('file', new Blob([fileUpload.file]), fileUpload.filename);
    } else {
      formData.append('file', new Blob([fileUpload.file]), fileUpload.filename);
    }
    
    if (fileUpload.title) formData.append('title', fileUpload.title);
    if (fileUpload.initial_comment) formData.append('initial_comment', fileUpload.initial_comment);
    if (fileUpload.thread_ts) formData.append('thread_ts', fileUpload.thread_ts);

    const response = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return result;
  }

  async getChannels(credentialId: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    try {
      // Try the newer conversations.list API first (requires more scopes)
      const result = await this.makeSlackRequest('conversations.list', botToken);
      return result.channels as SlackChannelInfo[];
    } catch (error) {
      // Fallback to older channels.list API (requires only channels:read scope)
      console.log('Falling back to channels.list API due to scope limitations');
      try {
        const result = await this.makeSlackRequest('channels.list', botToken);
        return result.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          is_private: false, // channels.list only shows public channels
          is_archived: channel.is_archived || false,
          num_members: channel.num_members || 0,
          purpose: channel.purpose ? { value: channel.purpose.value } : null
        })) as SlackChannelInfo[];
      } catch (fallbackError) {
        console.error('Both API methods failed:', { original: error, fallback: fallbackError });
        throw new Error('Unable to fetch channels. Please check your Slack app permissions.');
      }
    }
  }

  async getUsers(credentialId: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    const result = await this.makeSlackRequest('users.list', botToken);
    return result.members as SlackUserInfo[];
  }

  async getUserInfo(credentialId: string, userId: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    const result = await this.makeSlackRequest(`users.info?user=${userId}`, botToken);
    return result.user as SlackUserInfo;
  }

  async getChannelInfo(credentialId: string, channelId: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    const result = await this.makeSlackRequest(`conversations.info?channel=${channelId}`, botToken);
    return result.channel as SlackChannelInfo;
  }

  async inviteToChannel(credentialId: string, channelId: string, userIds: string[]) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('conversations.invite', botToken, 'POST', {
      channel: channelId,
      users: userIds.join(','),
    });
  }

  async createChannel(credentialId: string, name: string, isPrivate: boolean = false) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('conversations.create', botToken, 'POST', {
      name,
      is_private: isPrivate,
    });
  }

  async archiveChannel(credentialId: string, channelId: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('conversations.archive', botToken, 'POST', {
      channel: channelId,
    });
  }

  async sendEphemeralMessage(credentialId: string, channel: string, user: string, text: string, blocks?: any[]) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('chat.postEphemeral', botToken, 'POST', {
      channel,
      user,
      text,
      blocks,
    });
  }

  async updateMessage(credentialId: string, channel: string, ts: string, text: string, blocks?: any[]) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('chat.update', botToken, 'POST', {
      channel,
      ts,
      text,
      blocks,
    });
  }

  async deleteMessage(credentialId: string, channel: string, ts: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('chat.delete', botToken, 'POST', {
      channel,
      ts,
    });
  }

  async addReaction(credentialId: string, channel: string, timestamp: string, name: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('reactions.add', botToken, 'POST', {
      channel,
      timestamp,
      name,
    });
  }

  async removeReaction(credentialId: string, channel: string, timestamp: string, name: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    return await this.makeSlackRequest('reactions.remove', botToken, 'POST', {
      channel,
      timestamp,
      name,
    });
  }

  async getReactions(credentialId: string, channel: string, timestamp: string) {
    const credential = await this.getCredential(credentialId);
    const { botToken } = credential.config;

    const result = await this.makeSlackRequest(`reactions.get?channel=${channel}&timestamp=${timestamp}`, botToken);
    return result.message;
  }

  async testAuth(credentialId: string) {
    try {
      const credential = await this.getCredential(credentialId);
      const { botToken } = credential.config;

      console.log('Testing Slack authentication for credential:', credentialId);

      // Test basic auth with auth.test
      const authTest = await this.makeSlackRequest('auth.test', botToken);
      
      // Test bot info
      const botInfo = await this.makeSlackRequest('bots.info', botToken);
      
      // Test if we can list channels (basic permission check)
      let channelsAccess = false;
      try {
        await this.makeSlackRequest('channels.list', botToken);
        channelsAccess = true;
      } catch (error) {
        console.log('Channels access test failed:', error);
      }

      return {
        success: true,
        bot: {
          id: botInfo.bot.id,
          name: botInfo.bot.name,
          team: authTest.team,
          user: authTest.user,
          teamId: authTest.team_id,
          userId: authTest.user_id
        },
        permissions: {
          canListChannels: channelsAccess,
          scopes: botInfo.bot.scopes || []
        },
        workspace: {
          name: authTest.team,
          id: authTest.team_id
        }
      };
    } catch (error) {
      console.error('Slack auth test failed:', error);
      throw error;
    }
  }

  // Helper method to create rich message blocks
  createMessageBlocks(sections: Array<{ type: 'text' | 'divider' | 'actions'; content: any }>) {
    const blocks: any[] = [];

    sections.forEach(section => {
      switch (section.type) {
        case 'text':
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: section.content,
            },
          });
          break;
        case 'divider':
          blocks.push({ type: 'divider' });
          break;
        case 'actions':
          blocks.push({
            type: 'actions',
            elements: section.content,
          });
          break;
      }
    });

    return blocks;
  }

  // Helper method to create action buttons
  createActionButton(text: string, value: string, style: 'primary' | 'danger' = 'primary') {
    return {
      type: 'button',
      text: {
        type: 'plain_text',
        text,
      },
      value,
      style,
    };
  }
}

export const slackService = new SlackService();

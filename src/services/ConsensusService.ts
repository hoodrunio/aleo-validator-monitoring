import { AleoNetworkClient } from '@aleohq/sdk';

export class ConsensusService {
  private networkClient: AleoNetworkClient;

  constructor(networkUrl: string) {
    this.networkClient = new AleoNetworkClient(networkUrl);
  }

  async getCurrentRound(): Promise<number> {
    try {
      const latestBlock = await this.networkClient.getLatestBlock();
      if (typeof latestBlock === 'object' && latestBlock !== null && 'height' in latestBlock) {
        return latestBlock.height as number;
      }
      throw new Error('Blok yüksekliği bulunamadı');
    } catch (error) {
      console.error('Mevcut tur alınırken hata oluştu:', error);
      throw new Error('Mevcut tur alınamadı');
    }
  }

  async getCommittee(): Promise<string[]> {
    try {
      const committee = await this.networkClient.getLatestCommittee();
      if (typeof committee === 'object' && committee !== null && 'members' in committee) {
        return committee.members as string[];
      }
      throw new Error('Komite üyeleri bulunamadı');
    } catch (error) {
      console.error('Komite alınırken hata oluştu:', error);
      throw new Error('Komite alınamadı');
    }
  }
}

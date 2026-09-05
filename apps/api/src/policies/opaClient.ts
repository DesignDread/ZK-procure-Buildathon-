import axios from 'axios';

const OPA_URL = process.env.OPA_URL || 'http://localhost:8181';

export class OpaClient {
  async evaluate(regoPackage: string, input: any): Promise<any> {
    try {
      const response = await axios.post(`${OPA_URL}/v1/data/${regoPackage}`, { input });
      return response.data;
    } catch (error) {
      console.error(`OPA Evaluation Failed: ${error}`);
      throw new Error('OPA Evaluation Failed');
    }
  }

  async uploadPolicy(id: string, regoContent: string): Promise<boolean> {
    try {
      const response = await axios.put(`${OPA_URL}/v1/policies/${id}`, regoContent, {
        headers: { 'Content-Type': 'text/plain' }
      });
      return response.status === 200;
    } catch (error) {
      console.error(`OPA Policy Upload Failed: ${error}`);
      throw new Error('OPA Policy Upload Failed');
    }
  }
}

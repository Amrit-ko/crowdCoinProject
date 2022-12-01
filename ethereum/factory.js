import web3 from './web3';
import CampaignFactory from './build/CampaignFactory.json';

const instance = new web3.eth.Contract(
    CampaignFactory.abi,
    '0x8660eC841b0F40CF516B753DaffB40a50933005e'
);

export default instance;
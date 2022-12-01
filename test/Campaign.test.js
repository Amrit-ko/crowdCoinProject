const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require ('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require ('../ethereum/build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach ( async () => {
    accounts = await web3.eth.getAccounts();

    factory = await new web3.eth.Contract(compiledFactory.abi)
    .deploy ({data: compiledFactory.evm.bytecode.object})
    .send ({from : accounts[0], gas : '1400000' });

    await factory.methods.createCampaign('100')
    .send({ from: accounts[0], gas: '1400000'});

    [campaignAddress] = await factory.methods.getDeployedCampaigns().call();
    campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe( 'Campaigns', () => {
    it ('deploys contracts', () => {
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });

    it ('manager is correct', async () => {
        const manager = await campaign.methods.manager().call();
        assert.equal(accounts[0], manager);
    });

    it ('allows people to contribute and mark them as approvers', async () => {
        await campaign.methods.contribute().send({
            value: '200',
            from: accounts[1] 
        });
        const isContribute = await campaign.methods.approvers(accounts[1]).call();
        assert(isContribute);
    });

    it.only ('requires minimum contribution', async () => {
        let a = 1;
        try {
            await campaign.methods.contribute().send({
                value: '1',
                from: accounts[1]
            });
            
        } catch (error) {
            a=2;
            assert(error)
        }
        if (a==1) {
            assert(false);
        }
    });

    it ('allow manager to create request', async () => {
        await campaign.methods.createRequest('Bom Bhole!', '108', accounts[3]).send({
            from: accounts[0],
            gas: '1000000'
        });
        const request = await campaign.methods.requests(0).call();
        assert.equal('Bom Bhole!', request.description);
    });

    it ('complete test', async () => {
        await campaign.methods.contribute().send({
            value: web3.utils.toWei('10', 'ether'),
            from: accounts[2]
        });
    
        await campaign.methods.createRequest('Om Namah Shivaya!', web3.utils.toWei('5', 'ether'), accounts[3    ])
        .send({from: accounts[0], gas: 1000000});

        await campaign.methods.approveRequest(0).send({
            from: accounts[2],
            gas: '1000000'
        });

        let balance1 = await web3.eth.getBalance(accounts[3]);
        console.log(balance1);
        balance1 = web3.utils.fromWei(balance1, 'ether')
        
        balance1 = parseFloat(balance1);
        console.log(balance1);

        await campaign.methods.finalizeRequest(0).send({
            from: accounts[0],
            gas: '1000000'
        });
        let balance = await web3.eth.getBalance(accounts[3]);
        balance = web3.utils.fromWei(balance, 'ether')
        balance = parseFloat(balance);
        console.log(balance);
        assert.ok((balance - balance1) == 5);    
    })
});

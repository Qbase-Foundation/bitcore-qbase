'use strict';

var should = require('chai').should();
var ritocore = require('../');

describe('Library', function() {
  it('should export primatives', function() {
    should.exist(ritocore.crypto);
    should.exist(ritocore.encoding);
    should.exist(ritocore.util);
    should.exist(ritocore.errors);
    should.exist(ritocore.Address);
    should.exist(ritocore.Block);
    should.exist(ritocore.MerkleBlock);
    should.exist(ritocore.BlockHeader);
    should.exist(ritocore.HDPrivateKey);
    should.exist(ritocore.HDPublicKey);
    should.exist(ritocore.Networks);
    should.exist(ritocore.Opcode);
    should.exist(ritocore.PrivateKey);
    should.exist(ritocore.PublicKey);
    should.exist(ritocore.Script);
    should.exist(ritocore.Transaction);
    should.exist(ritocore.URI);
    should.exist(ritocore.Unit);
  });
});

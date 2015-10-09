'use strict';

const util = require('util');
const hashprefixes = require('./hashprefixes');
const sha512half = require('./utils').sha512half;
const HEX_ZERO = '00000000000000000000000000000000' +
               '00000000000000000000000000000000';

/**
 * Abstract class representing a node in a SHAMap tree.
 *
 * Can be either SHAMapTreeNodeInner or SHAMapTreeNodeLeaf.
 *
 * @class
 */
function SHAMapTreeNode() { }

SHAMapTreeNode.TYPE_INNER = 1;
SHAMapTreeNode.TYPE_TRANSACTION_NM = 2;
SHAMapTreeNode.TYPE_TRANSACTION_MD = 3;
SHAMapTreeNode.TYPE_ACCOUNT_STATE = 4;

function hash(hex) {
  return sha512half(new Buffer(hex, 'hex'));
}

/**
* @param {String} tag (64 hexadecimal characters)
* @param {SHAMapTreeNode} node
* @return {void}
* @virtual
*/
/* eslint-disable no-unused-vars*/
SHAMapTreeNode.prototype.add_item = function(tag, node) {
  throw new Error(
    'Called unimplemented virtual method SHAMapTreeNode#add_item.');
};
/* eslint-enable no-unused-vars*/

SHAMapTreeNode.prototype.hash = function() {
  throw new Error('Called unimplemented virtual method SHAMapTreeNode#hash.');
};

/**
 * Inner (non-leaf) node in a SHAMap tree.
 * @param {Number} depth (i.e. how many parent inner nodes)
 * @class
 */
function SHAMapTreeNodeInner(depth) {
  SHAMapTreeNode.call(this);
  this.leaves = {};
  this.type = SHAMapTreeNode.INNER;
  this.depth = depth === undefined ? 0 : depth;
  this.empty = true;
}

util.inherits(SHAMapTreeNodeInner, SHAMapTreeNode);

/**
 * @param {String} tag (equates to a ledger entry `index`)
 * @param {SHAMapTreeNode} node (to add)
 * @return {void}
 */
SHAMapTreeNodeInner.prototype.add_item = function(tag, node) {
  const depth = this.depth;
  const existing_node = this.get_node(tag[depth]);

  if (existing_node) {
    // A node already exists in this slot
    if (existing_node instanceof SHAMapTreeNodeInner) {
      // There is an inner node, so we need to go deeper
      existing_node.add_item(tag, node);
    } else if (existing_node.tag === tag) {
      // Collision
      throw new Error(
          'Tried to add a node to a SHAMap that was already in there.');
    } else {
      // Turn it into an inner node
      const new_inner_node = new SHAMapTreeNodeInner(depth + 1);

      // Parent new and existing node
      new_inner_node.add_item(existing_node.tag, existing_node);
      new_inner_node.add_item(tag, node);

      // And place the newly created inner node in the slot
      this.set_node(tag[depth], new_inner_node);
    }
  } else {
    // Neat, we have a nice open spot for the new node
    this.set_node(tag[depth], node);
  }
};

/**
 * Overwrite the node that is currently in a given slot.
 * @param {String} slot (a character 0-F)
 * @param {SHAMapTreeNode} node (to place)
 * @return {void}
 */
SHAMapTreeNodeInner.prototype.set_node = function(slot, node) {
  this.leaves[slot] = node;
  this.empty = false;
};

SHAMapTreeNodeInner.prototype.get_node = function(slot) {
  return this.leaves[slot];
};

SHAMapTreeNodeInner.prototype.hash = function() {
  if (this.empty) {
    return HEX_ZERO;
  }

  let hex = '';
  for (let i = 0; i < 16; i++) {
    const slot = i.toString(16).toUpperCase();
    hex += this.leaves[slot] ? this.leaves[slot].hash() : HEX_ZERO;
  }

  const prefix = hashprefixes.HASH_INNER_NODE.toString(16);
  return hash(prefix + hex);
};

/**
 * Leaf node in a SHAMap tree.
 * @param {String} tag (equates to a ledger entry `index`)
 * @param {String} data (hex of account state, transaction etc)
 * @param {Number} type (one of TYPE_ACCOUNT_STATE, TYPE_TRANSACTION_MD etc)
 * @class
 */
function SHAMapTreeNodeLeaf(tag, data, type) {
  SHAMapTreeNode.call(this);

  if (typeof tag !== 'string') {
    throw new Error('Tag is unexpected type.');
  }

  this.tag = tag;
  this.type = type;
  this.data = data;
}

util.inherits(SHAMapTreeNodeLeaf, SHAMapTreeNode);

SHAMapTreeNodeLeaf.prototype.hash = function() {
  switch (this.type) {
    case SHAMapTreeNode.TYPE_ACCOUNT_STATE:
      const leafPrefix = hashprefixes.HASH_LEAF_NODE.toString(16);
      return hash(leafPrefix + this.data + this.tag);
    case SHAMapTreeNode.TYPE_TRANSACTION_NM:
      return this.tag;
    case SHAMapTreeNode.TYPE_TRANSACTION_MD:
      const txPrefix = hashprefixes.HASH_TX_NODE.toString(16);
      return hash(txPrefix + this.data + this.tag);
    default:
      throw new Error('Tried to hash a SHAMap node of unknown type.');
  }
};

function SHAMap() {
  this.root = new SHAMapTreeNodeInner(0);
}

SHAMap.prototype.add_item = function(tag, data, type) {
  this.root.add_item(tag, new SHAMapTreeNodeLeaf(tag, data, type));
};

SHAMap.prototype.hash = function() {
  return this.root.hash();
};

exports.SHAMap = SHAMap;
exports.SHAMapTreeNode = SHAMapTreeNode;
exports.SHAMapTreeNodeInner = SHAMapTreeNodeInner;
exports.SHAMapTreeNodeLeaf = SHAMapTreeNodeLeaf;

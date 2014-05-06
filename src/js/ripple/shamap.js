var util = require('util');
var sjcl = require('./utils').sjcl;
var stypes = require('./serializedtypes');
var hashprefixes = require('./hashprefixes');

var UInt256 = require('./uint256').UInt256;
var SerializedObject = require('./serializedobject').SerializedObject;

function SHAMap() {
  this.root = new SHAMapTreeNodeInner(0);
};

SHAMap.prototype.add_item = function (tag, node, type) {
  var node = new SHAMapTreeNodeLeaf(tag, node, type);
  this.root.add_item(tag, node);
};

SHAMap.prototype.hash = function () {
  return this.root.hash();
};

/**
 * Abstract class representing a node in a SHAMap tree.
 *
 * Can be either SHAMapTreeNodeInner or SHAMapTreeNodeLeaf.
 */
function SHAMapTreeNode() {

};

SHAMapTreeNode.TYPE_INNER = 1;
SHAMapTreeNode.TYPE_TRANSACTION_NM = 2;
SHAMapTreeNode.TYPE_TRANSACTION_MD = 3;
SHAMapTreeNode.TYPE_ACCOUNT_STATE = 4;

SHAMapTreeNode.prototype.add_item = function (tag_segment, node) {
  throw new Error("Called unimplemented virtual method SHAMapTreeNode#add_item.");
};

SHAMapTreeNode.prototype.hash = function () {
  throw new Error("Called unimplemented virtual method SHAMapTreeNode#hash.");
};

/**
 * Inner (non-leaf) node in a SHAMap tree.
 */
function SHAMapTreeNodeInner(depth) {
  SHAMapTreeNode.call(this);

  this.leaves = {};

  this.type = SHAMapTreeNode.INNER;
  this.depth = depth == null ? 0 : depth;

  this.empty = true;
}

util.inherits(SHAMapTreeNodeInner, SHAMapTreeNode);

/*
* @param tag_segment {String} (equates to a ledger entries `index`)
*/
SHAMapTreeNodeInner.prototype.add_item = function (tag_segment, node) {
  var depth = this.depth;
  var existing_node = this.get_node(tag_segment[depth]);

  if (existing_node) {
    // A node already exists in this slot
    if (existing_node instanceof SHAMapTreeNodeInner) {
      // There is an inner node, so we need to go deeper
      existing_node.add_item(tag_segment, node);
    } else if (existing_node.get_segment() === tag_segment) {
      // Collision
      throw new Error("Tried to add a node to a SHAMap that was already in there.");
    } else {
      // Turn it into an inner node
      var new_inner_node = new SHAMapTreeNodeInner(depth + 1);

      // Parent new and existing node
      new_inner_node.add_item(existing_node.get_segment(), existing_node);
      new_inner_node.add_item(tag_segment, node);

      // And place the newly created inner node in the slot
      this.set_node(tag_segment[depth], new_inner_node);
    }
  } else {
    // Neat, we have a nice open spot for the new node
    node.set_segment(tag_segment);
    this.set_node(tag_segment[depth], node);
  }
};

/**
 * Overwrite the node that is currently in a given slot.
 */
SHAMapTreeNodeInner.prototype.set_node = function (slot, node) {
  this.leaves[slot] = node;
  this.empty = false;
};

SHAMapTreeNodeInner.prototype.get_node = function (slot) {
  return this.leaves[slot];
};

SHAMapTreeNodeInner.prototype.hash = function () {
  if (this.empty) {
    return UInt256.from_hex(UInt256.HEX_ZERO);
  }

  var hash_buffer = new SerializedObject();
  var buffer = [];
  for (var i = 0; i < 16; i++) {
    var leafHash = UInt256.from_hex(UInt256.HEX_ZERO);
    var slot = i.toString(16).toUpperCase();
    if ("object" === typeof this.leaves[slot]) {
      leafHash = this.leaves[slot].hash();
    }
    hash_buffer.append(leafHash.to_bytes());
  }

  var hash = hash_buffer.hash(hashprefixes.HASH_INNER_NODE);

  return UInt256.from_bits(hash);
};

/**
 * Leaf node in a SHAMap tree.
 */
function SHAMapTreeNodeLeaf(tag, node, type) {
  SHAMapTreeNode.call(this);

  if ("string" === typeof tag) {
    tag = UInt256.from_hex(tag);
  } else if (tag instanceof UInt256) {
    // Type is already the right one
  } else {
    throw new Error("Tag is unexpected type.");
  }

  this.tag = tag;
  this.tag_segment = null;

  this.type = type;

  this.node = node;
}
util.inherits(SHAMapTreeNodeLeaf, SHAMapTreeNode);

SHAMapTreeNodeLeaf.prototype.get_segment = function (segment) {
  return this.tag_segment;
};

SHAMapTreeNodeLeaf.prototype.set_segment = function (segment) {
  this.tag_segment = segment;
};

SHAMapTreeNodeLeaf.prototype.hash = function () {
  var buffer = new SerializedObject();
  switch (this.type) {
    case SHAMapTreeNode.TYPE_ACCOUNT_STATE:
      buffer.append(this.node);
      buffer.append(this.tag.to_bytes());
      return buffer.hash(hashprefixes.HASH_LEAF_NODE);
    case SHAMapTreeNode.TYPE_TRANSACTION_NM:
      return this.tag;
    case SHAMapTreeNode.TYPE_TRANSACTION_MD:
      buffer.append(this.node);
      buffer.append(this.tag.to_bytes());
      return buffer.hash(hashprefixes.HASH_TX_NODE);
    default:
      throw new Error("Tried to hash a SHAMap node of unknown type.");
  }
};

exports.SHAMap = SHAMap;
exports.SHAMapTreeNode = SHAMapTreeNode;
exports.SHAMapTreeNodeInner = SHAMapTreeNodeInner;
exports.SHAMapTreeNodeLeaf = SHAMapTreeNodeLeaf;

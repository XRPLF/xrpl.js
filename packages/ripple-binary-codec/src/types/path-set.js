'use strict';
/* eslint-disable no-unused-expressions */

const makeClass = require('../utils/make-class');
const {SerializedType, ensureArrayLikeIs} = require('./serialized-type');
const {Currency} = require('./currency');
const {AccountID} = require('./account-id');

const PATHSET_END_BYTE = 0x00;
const PATH_SEPARATOR_BYTE = 0xFF;
const TYPE_ACCOUNT = 0x01;
const TYPE_CURRENCY = 0x10;
const TYPE_ISSUER = 0x20;

const Hop = makeClass({
  statics: {
    from(value) {
      if (value instanceof this) {
        return value;
      }
      const hop = new Hop();
      value.issuer && (hop.issuer = AccountID.from(value.issuer));
      value.account && (hop.account = AccountID.from(value.account));
      value.currency && (hop.currency = Currency.from(value.currency));
      return hop;
    },
    parse(parser, type) {
      const hop = new Hop();
      (type & TYPE_ACCOUNT) && (hop.account = AccountID.fromParser(parser));
      (type & TYPE_CURRENCY) && (hop.currency = Currency.fromParser(parser));
      (type & TYPE_ISSUER) && (hop.issuer = AccountID.fromParser(parser));
      return hop;
    }
  },
  toJSON() {
    const type = this.type();
    const ret = {};
    (type & TYPE_ACCOUNT) && (ret.account = this.account.toJSON());
    (type & TYPE_ISSUER) && (ret.issuer = this.issuer.toJSON());
    (type & TYPE_CURRENCY) && (ret.currency = this.currency.toJSON());
    return ret;
  },
  type() {
    let type = 0;
    this.issuer && (type += TYPE_ISSUER);
    this.account && (type += TYPE_ACCOUNT);
    this.currency && (type += TYPE_CURRENCY);
    return type;
  }
});

const Path = makeClass({
  inherits: Array,
  statics: {
    from(value) {
      return ensureArrayLikeIs(Path, value).withChildren(Hop);
    }
  },
  toJSON() {
    return this.map(k => k.toJSON());
  }
});

const PathSet = makeClass({
  mixins: SerializedType,
  inherits: Array,
  statics: {
    from(value) {
      return ensureArrayLikeIs(PathSet, value).withChildren(Path);
    },
    fromParser(parser) {
      const pathSet = new this();
      let path;
      while (!parser.end()) {
        const type = parser.readUInt8();
        if (type === PATHSET_END_BYTE) {
          break;
        }
        if (type === PATH_SEPARATOR_BYTE) {
          path = null;
          continue;
        }
        if (!path) {
          path = new Path();
          pathSet.push(path);
        }
        path.push(Hop.parse(parser, type));
      }
      return pathSet;
    }
  },
  toJSON() {
    return this.map(k => k.toJSON());
  },
  toBytesSink(sink) {
    let n = 0;
    this.forEach((path) => {
      if (n++ !== 0) {
        sink.put([PATH_SEPARATOR_BYTE]);
      }
      path.forEach((hop) => {
        sink.put([hop.type()]);
        hop.account && (hop.account.toBytesSink(sink));
        hop.currency && (hop.currency.toBytesSink(sink));
        hop.issuer && (hop.issuer.toBytesSink(sink));
      });
    });
    sink.put([PATHSET_END_BYTE]);
  }
});

module.exports = {
  PathSet
};

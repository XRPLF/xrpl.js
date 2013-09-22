sjcl.bn.prototype.invDigit = function ()
{
  var radixMod = 1 + this.radixMask;

  if (this.limbs.length < 1) return 0;
  var x = this.limbs[0];
  if ((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < radixMod <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%radixMod))%radixMod;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?radixMod-y:-y;
};

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// JSBN-style add and multiply for SJCL w/ 24 bit radix
sjcl.bn.prototype.am = function (i,x,w,j,c,n) {
  var xl = x&0xfff, xh = x>>12;
  while (--n >= 0) {
    var l = this.limbs[i]&0xfff;
    var h = this.limbs[i++]>>12;
    var m = xh*l+h*xl;
    l = xl*l+((m&0xfff)<<12)+w.limbs[j]+c;
    c = (l>>24)+(m>>12)+xh*h;
    w.limbs[j++] = l&0xffffff;
  }
  return c;
}

var Montgomery = function (m)
{
  this.m = m;
  this.mt = m.limbs.length;
  this.mt2 = this.mt * 2;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.radix-15))-1;
};

Montgomery.prototype.reduce = function (x)
{
  var radixMod = x.radixMask + 1;
  while (x.limbs.length <= this.mt2)	// pad x so am has enough room later
    x.limbs[x.limbs.length] = 0;
  for (var i = 0; i < this.mt; ++i) {
    // faster way of calculating u0 = x[i]*mp mod 2^radix
    var j = x.limbs[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x.limbs[i]>>15)*this.mpl)&this.um)<<15))&x.radixMask;
    // use am to combine the multiply-shift-add into one call
    j = i+this.mt;
    x.limbs[j] += this.m.am(0,u0,x,i,0,this.mt);
    // propagate carry
    while (x.limbs[j] >= radixMod) { x.limbs[j] -= radixMod; x.limbs[++j]++; }
  }
  x.trim();
  x = x.shiftRight(this.mt * this.m.radix);
  if (x.greaterEquals(this.m)) x = x.sub(this.m);
  return x.trim().normalize().reduce();
};

Montgomery.prototype.square = function (x)
{
  return this.reduce(x.square());
};

Montgomery.prototype.multiply = function (x, y)
{
  return this.reduce(x.mul(y));
};

Montgomery.prototype.convert = function (x)
{
  return x.abs().shiftLeft(this.mt * this.m.radix).mod(this.m);
};

Montgomery.prototype.revert = function (x)
{
  return this.reduce(x.copy());
};

sjcl.bn.prototype.powermodMontgomery = function (e, m)
{
  var i = e.bitLength(), k, r = new this._class(1);

  if (i <= 0) return r;
  else if (i < 18) k = 1;
  else if (i < 48) k = 3;
  else if (i < 144) k = 4;
  else if (i < 768) k = 5;
  else k = 6;

  if (i < 8 || !m.testBit(0)) {
    // For small exponents and even moduli, use a simple square-and-multiply
    // algorithm.
    return this.powermod(e, m);
  }

  var z = new Montgomery(m);

  e.trim().normalize();

  // precomputation
  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
  g[1] = z.convert(this);
  if (k > 1) {
    var g2 = z.square(g[1]);

    while (n <= km) {
      g[n] = z.multiply(g2, g[n-2]);
      n += 2;
    }
  }

  var j = e.limbs.length-1, w, is1 = true, r2 = new this._class(), t;
  i = nbits(e.limbs[j])-1;
  while (j >= 0) {
    if (i >= k1) w = (e.limbs[j]>>(i-k1))&km;
    else {
      w = (e.limbs[j]&((1<<(i+1))-1))<<(k1-i);
      if (j > 0) w |= e.limbs[j-1]>>(this.radix+i-k1);
    }

    n = k;
    while ((w&1) == 0) { w >>= 1; --n; }
    if ((i -= n) < 0) { i += this.radix; --j; }
    if (is1) {	// ret == 1, don't bother squaring or multiplying it
      r = g[w].copy();
      is1 = false;
    } else {
      while (n > 1) { r2 = z.square(r); r = z.square(r2); n -= 2; }
      if (n > 0) r2 = z.square(r); else { t = r; r = r2; r2 = t; }
      r = z.multiply(r2,g[w]);
    }

    while (j >= 0 && (e.limbs[j]&(1<<i)) == 0) {
      r2 = z.square(r); t = r; r = r2; r2 = t;
      if (--i < 0) { i = this.radix-1; --j; }
    }
  }
  return z.revert(r);
}

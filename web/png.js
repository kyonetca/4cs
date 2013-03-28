// Generated by CoffeeScript 1.4.0

/*
# MIT LICENSE
# Copyright (c) 2011 Devon Govett
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify, merge,
# publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
# to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or
# substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


(function() {
	var PNG;

	PNG = (function() {
		var APNG_BLEND_OP_OVER, APNG_BLEND_OP_SOURCE, APNG_DISPOSE_OP_BACKGROUND, APNG_DISPOSE_OP_NONE, APNG_DISPOSE_OP_PREVIOUS, makeImage, scratchCanvas, scratchCtx;

		PNG.load = function(url, canvas, callback) {
			var xhr,
				_this = this;
			if (typeof canvas === 'function') {
				callback = canvas;
			}
			xhr = new XMLHttpRequest;
			xhr.open("GET", url, true);
			xhr.responseType = "arraybuffer";
			xhr.onload = function() {
				var data, png;
				data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
				png = new PNG(data);
				if (typeof (canvas != null ? canvas.getContext : void 0) === 'function') {
					png.render(canvas);
				}
				return typeof callback === "function" ? callback(png) : void 0;
			};
			return xhr.send(null);
		};

		APNG_DISPOSE_OP_NONE = 0;

		APNG_DISPOSE_OP_BACKGROUND = 1;

		APNG_DISPOSE_OP_PREVIOUS = 2;

		APNG_BLEND_OP_SOURCE = 0;

		APNG_BLEND_OP_OVER = 1;

		function PNG(data, asynchronous, asynchronous_callback) {
			if (asynchronous) this.initAsynchronous(data, asynchronous_callback);
			else this.init(data);
		}
		PNG.prototype.init = function (data) {
			var chunkSize, colors, delayDen, delayNum, frame, i, index, key, section, short, text, _i, _j, _ref;
			this.data = data;
			this.pos = 8;
			this.palette = [];
			this.imgData = [];
			this.transparency = {};
			this.animation = null;
			this.text = {};
			frame = null;
			while (true) {
				chunkSize = this.readUInt32();
				section = ((function() {
					var _i, _results;
					_results = [];
					for (i = _i = 0; _i < 4; i = ++_i) {
						_results.push(String.fromCharCode(this.data[this.pos++]));
					}
					return _results;
				}).call(this)).join('');
				switch (section) {
					case 'IHDR':
						this.width = this.readUInt32();
						this.height = this.readUInt32();
						this.bits = this.data[this.pos++];
						this.colorType = this.data[this.pos++];
						this.compressionMethod = this.data[this.pos++];
						this.filterMethod = this.data[this.pos++];
						this.interlaceMethod = this.data[this.pos++];
						break;
					case 'acTL':
						this.animation = {
							numFrames: this.readUInt32(),
							numPlays: this.readUInt32() || Infinity,
							frames: []
						};
						break;
					case 'PLTE':
						this.palette = this.read(chunkSize);
						break;
					case 'fcTL':
						if (frame) {
							this.animation.frames.push(frame);
						}
						this.pos += 4;
						frame = {
							width: this.readUInt32(),
							height: this.readUInt32(),
							xOffset: this.readUInt32(),
							yOffset: this.readUInt32()
						};
						delayNum = this.readUInt16();
						delayDen = this.readUInt16() || 100;
						frame.delay = 1000 * delayNum / delayDen;
						frame.disposeOp = this.data[this.pos++];
						frame.blendOp = this.data[this.pos++];
						frame.data = [];
						break;
					case 'IDAT':
					case 'fdAT':
						if (section === 'fdAT') {
							this.pos += 4;
							chunkSize -= 4;
						}
						data = (frame != null ? frame.data : void 0) || this.imgData;
						for (i = _i = 0; 0 <= chunkSize ? _i < chunkSize : _i > chunkSize; i = 0 <= chunkSize ? ++_i : --_i) {
							data.push(this.data[this.pos++]);
						}
						break;
					case 'tRNS':
						this.transparency = {};
						switch (this.colorType) {
							case 3:
								this.transparency.indexed = this.read(chunkSize);
								short = 255 - this.transparency.indexed.length;
								if (short > 0) {
									for (i = _j = 0; 0 <= short ? _j < short : _j > short; i = 0 <= short ? ++_j : --_j) {
										this.transparency.indexed.push(255);
									}
								}
								break;
							case 0:
								this.transparency.grayscale = this.read(chunkSize)[0];
								break;
							case 2:
								this.transparency.rgb = this.read(chunkSize);
						}
						break;
					case 'tEXt':
						text = this.read(chunkSize);
						index = text.indexOf(0);
						key = String.fromCharCode.apply(String, text.slice(0, index));
						this.text[key] = String.fromCharCode.apply(String, text.slice(index + 1));
						break;
					case 'IEND':
						if (frame) {
							this.animation.frames.push(frame);
						}
						this.colors = (function() {
							switch (this.colorType) {
								case 0:
								case 3:
								case 4:
									return 1;
								case 2:
								case 6:
									return 3;
							}
						}).call(this);
						this.hasAlphaChannel = (_ref = this.colorType) === 4 || _ref === 6;
						colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
						this.pixelBitlength = this.bits * colors;
						this.colorSpace = (function() {
							switch (this.colors) {
								case 1:
									return 'DeviceGray';
								case 3:
									return 'DeviceRGB';
							}
						}).call(this);
						this.imgData = new Uint8Array(this.imgData);
						return;
					default:
						this.pos += chunkSize;
				}
				this.pos += 4;
				if (this.pos > this.data.length) {
					throw new Error("Incomplete or corrupt PNG file");
				}
			}
			return;
		}
		PNG.prototype.initAsynchronous = function (data, asynchronous_callback, loop_param) {
			try {
				var loop = new Loop();
				if (loop_param === undefined) {
					loop.steps = 1024 * 64;
					loop.timeout = 1;
				}
				else {
					loop.steps = loop_param.steps;
					loop.timeout = loop_param.timeout;
				}
			}
			catch (e) {
				// Error
				return this.init(data);
			}
			var chunkSize, colors, delayDen, delayNum, frame, i, index, key, section, short, text, _i, _j, _ref;
			this.data = data;
			this.pos = 8;
			this.palette = [];
			this.imgData = [];
			this.transparency = {};
			this.animation = null;
			this.text = {};
			frame = null;

			var self = this;
			loop.forever(
				{},
				function (unused, data, loop) {
					chunkSize = self.readUInt32();
					section = ((function() {
						var _i, _results;
						_results = [];
						for (i = _i = 0; _i < 4; i = ++_i) {
							_results.push(String.fromCharCode(self.data[self.pos++]));
						}
						return _results;
					}).call(self)).join('');
					switch (section) {
						case 'IHDR':
							self.width = self.readUInt32();
							self.height = self.readUInt32();
							self.bits = self.data[self.pos++];
							self.colorType = self.data[self.pos++];
							self.compressionMethod = self.data[self.pos++];
							self.filterMethod = self.data[self.pos++];
							self.interlaceMethod = self.data[self.pos++];
							break;
						case 'acTL':
							self.animation = {
								numFrames: self.readUInt32(),
								numPlays: self.readUInt32() || Infinity,
								frames: []
							};
							break;
						case 'PLTE':
							self.palette = self.read(chunkSize);
							break;
						case 'fcTL':
							if (frame) {
								self.animation.frames.push(frame);
							}
							self.pos += 4;
							frame = {
								width: self.readUInt32(),
								height: self.readUInt32(),
								xOffset: self.readUInt32(),
								yOffset: self.readUInt32()
							};
							delayNum = self.readUInt16();
							delayDen = self.readUInt16() || 100;
							frame.delay = 1000 * delayNum / delayDen;
							frame.disposeOp = self.data[self.pos++];
							frame.blendOp = self.data[self.pos++];
							frame.data = [];
							break;
						case 'IDAT':
						case 'fdAT':
							if (section === 'fdAT') {
								self.pos += 4;
								chunkSize -= 4;
							}
							data = (frame != null ? frame.data : void 0) || self.imgData;
							for (i = _i = 0; 0 <= chunkSize ? _i < chunkSize : _i > chunkSize; i = 0 <= chunkSize ? ++_i : --_i) {
								data.push(self.data[self.pos++]);
							}
							break;
						case 'tRNS':
							self.transparency = {};
							switch (self.colorType) {
								case 3:
									self.transparency.indexed = self.read(chunkSize);
									short = 255 - self.transparency.indexed.length;
									if (short > 0) {
										for (i = _j = 0; 0 <= short ? _j < short : _j > short; i = 0 <= short ? ++_j : --_j) {
											self.transparency.indexed.push(255);
										}
									}
									break;
								case 0:
									self.transparency.grayscale = self.read(chunkSize)[0];
									break;
								case 2:
									self.transparency.rgb = self.read(chunkSize);
							}
							break;
						case 'tEXt':
							text = self.read(chunkSize);
							index = text.indexOf(0);
							key = String.fromCharCode.apply(String, text.slice(0, index));
							self.text[key] = String.fromCharCode.apply(String, text.slice(index + 1));
							break;
						case 'IEND':
							if (frame) {
								self.animation.frames.push(frame);
							}
							self.colors = (function() {
								switch (self.colorType) {
									case 0:
									case 3:
									case 4:
										return 1;
									case 2:
									case 6:
										return 3;
								}
							}).call(self);
							self.hasAlphaChannel = (_ref = self.colorType) === 4 || _ref === 6;
							colors = self.colors + (self.hasAlphaChannel ? 1 : 0);
							self.pixelBitlength = self.bits * colors;
							self.colorSpace = (function() {
								switch (self.colors) {
									case 1:
										return 'DeviceGray';
									case 3:
										return 'DeviceRGB';
								}
							}).call(self);
							self.imgData = new Uint8Array(self.imgData);
							return loop.Break(); // Done
						default:
							self.pos += chunkSize;
					}
					self.pos += 4;
					if (self.pos > self.data.length) {
						throw new Error("Incomplete or corrupt PNG file");
					}
				},
				function (unused, data, loop) {
					try {
						asynchronous_callback(self);
					}
					catch (e) {}
				}
			);
		}

		PNG.prototype.read = function(bytes) {
			var i, _i, _results;
			_results = [];
			for (i = _i = 0; 0 <= bytes ? _i < bytes : _i > bytes; i = 0 <= bytes ? ++_i : --_i) {
				_results.push(this.data[this.pos++]);
			}
			return _results;
		};

		PNG.prototype.readUInt32 = function() {
			var b1, b2, b3, b4;
			b1 = this.data[this.pos++] << 24;
			b2 = this.data[this.pos++] << 16;
			b3 = this.data[this.pos++] << 8;
			b4 = this.data[this.pos++];
			return b1 | b2 | b3 | b4;
		};

		PNG.prototype.readUInt16 = function() {
			var b1, b2;
			b1 = this.data[this.pos++] << 8;
			b2 = this.data[this.pos++];
			return b1 | b2;
		};

		PNG.prototype.decodePixels = function(data) {
			var byte, c, col, i, left, length, p, pa, paeth, pb, pc, pixelBytes, pixels, pos, row, scanlineLength, upper, upperLeft, _i, _j, _k, _l, _m;
			if (data == null) {
				data = this.imgData;
			}
			if (data.length === 0) {
				return new Uint8Array(0);
			}
			data = new FlateStream(data);
			data = data.getBytes();
			pixelBytes = this.pixelBitlength / 8;
			scanlineLength = pixelBytes * this.width;
			pixels = new Uint8Array(scanlineLength * this.height);
			length = data.length;
			row = 0;
			pos = 0;
			c = 0;
			while (pos < length) {
				switch (data[pos++]) {
					case 0:
						for (i = _i = 0; _i < scanlineLength; i = _i += 1) {
							pixels[c++] = data[pos++];
						}
						break;
					case 1:
						for (i = _j = 0; _j < scanlineLength; i = _j += 1) {
							byte = data[pos++];
							left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
							pixels[c++] = (byte + left) % 256;
						}
						break;
					case 2:
						for (i = _k = 0; _k < scanlineLength; i = _k += 1) {
							byte = data[pos++];
							col = (i - (i % pixelBytes)) / pixelBytes;
							upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
							pixels[c++] = (upper + byte) % 256;
						}
						break;
					case 3:
						for (i = _l = 0; _l < scanlineLength; i = _l += 1) {
							byte = data[pos++];
							col = (i - (i % pixelBytes)) / pixelBytes;
							left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
							upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
							pixels[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
						}
						break;
					case 4:
						for (i = _m = 0; _m < scanlineLength; i = _m += 1) {
							byte = data[pos++];
							col = (i - (i % pixelBytes)) / pixelBytes;
							left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
							if (row === 0) {
								upper = upperLeft = 0;
							} else {
								upper = pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
								upperLeft = col && pixels[(row - 1) * scanlineLength + (col - 1) * pixelBytes + (i % pixelBytes)];
							}
							p = left + upper - upperLeft;
							pa = Math.abs(p - left);
							pb = Math.abs(p - upper);
							pc = Math.abs(p - upperLeft);
							if (pa <= pb && pa <= pc) {
								paeth = left;
							} else if (pb <= pc) {
								paeth = upper;
							} else {
								paeth = upperLeft;
							}
							pixels[c++] = (byte + paeth) % 256;
						}
						break;
					default:
						throw new Error("Invalid filter algorithm: " + data[pos - 1]);
				}
				row++;
			}
			return pixels;
		};
		PNG.prototype.decodePixelsAsynchronous = function(data, done_callback, loop_param) {
			try {
				var loop = new Loop();
				if (loop_param === undefined) {
					loop.steps = 1024 * 64;
					loop.timeout = 1;
				}
				else {
					loop.steps = loop_param.steps;
					loop.timeout = loop_param.timeout;
				}
			}
			catch (e) {
				// Error
				return this.decodePixels(data);
			}

			var byte, c, col, i, left, length, p, pa, paeth, pb, pc, pixelBytes, pixels, pos, row, scanlineLength, upper, upperLeft, _i, _j, _k, _l, _m;
			if (data == null) {
				data = this.imgData;
			}
			if (data.length === 0) {
				return new Uint8Array(0);
			}
			data = new FlateStream(data);
			data = data.getBytes();
			pixelBytes = this.pixelBitlength / 8;
			scanlineLength = pixelBytes * this.width;
			pixels = new Uint8Array(scanlineLength * this.height);
			length = data.length;
			row = 0;
			pos = 0;
			c = 0;
			var self = this;
			loop.for_lt(
				pos, length, 0,
				{},
				function (pos, _data, loop) {
					switch (data[pos++]) {
						case 0:
							for (i = _i = 0; _i < scanlineLength; i = _i += 1) {
								pixels[c++] = data[pos++];
							}
						break;
						case 1:
							for (i = _j = 0; _j < scanlineLength; i = _j += 1) {
								byte = data[pos++];
								left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
								pixels[c++] = (byte + left) % 256;
							}
						break;
						case 2:
							for (i = _k = 0; _k < scanlineLength; i = _k += 1) {
								byte = data[pos++];
								col = (i - (i % pixelBytes)) / pixelBytes;
								upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
								pixels[c++] = (upper + byte) % 256;
							}
						break;
						case 3:
							for (i = _l = 0; _l < scanlineLength; i = _l += 1) {
								byte = data[pos++];
								col = (i - (i % pixelBytes)) / pixelBytes;
								left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
								upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
								pixels[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
							}
						break;
						case 4:
							for (i = _m = 0; _m < scanlineLength; i = _m += 1) {
								byte = data[pos++];
								col = (i - (i % pixelBytes)) / pixelBytes;
								left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
								if (row === 0) {
									upper = upperLeft = 0;
								} else {
									upper = pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
									upperLeft = col && pixels[(row - 1) * scanlineLength + (col - 1) * pixelBytes + (i % pixelBytes)];
								}
								p = left + upper - upperLeft;
								pa = Math.abs(p - left);
								pb = Math.abs(p - upper);
								pc = Math.abs(p - upperLeft);
								if (pa <= pb && pa <= pc) {
									paeth = left;
								} else if (pb <= pc) {
									paeth = upper;
								} else {
									paeth = upperLeft;
								}
								pixels[c++] = (byte + paeth) % 256;
							}
						break;
						default:
							throw new Error("Invalid filter algorithm: " + data[pos - 1]);
					}
					row++;
					return pos;
				},
				function (pos, _data, loop) {
					try {
						done_callback(self, pixels);
					}
					catch (e) {}
				}
			);
		};

		PNG.prototype.decodePalette = function() {
			var c, i, length, palette, pos, ret, transparency, _i, _ref, _ref1;
			palette = this.palette;
			transparency = this.transparency.indexed || [];
			ret = new Uint8Array((transparency.length || 0) + palette.length);
			pos = 0;
			length = palette.length;
			c = 0;
			for (i = _i = 0, _ref = palette.length; _i < _ref; i = _i += 3) {
				ret[pos++] = palette[i];
				ret[pos++] = palette[i + 1];
				ret[pos++] = palette[i + 2];
				ret[pos++] = (_ref1 = transparency[c++]) != null ? _ref1 : 255;
			}
			return ret;
		};

		PNG.prototype.copyToImageData = function(imageData, pixels) {
			var alpha, colors, data, i, input, j, k, length, palette, v, _ref;
			colors = this.colors;
			palette = null;
			alpha = this.hasAlphaChannel;
			if (this.palette.length) {
				palette = (_ref = this._decodedPalette) != null ? _ref : this._decodedPalette = this.decodePalette();
				colors = 4;
				alpha = true;
			}
			data = imageData.data;
			length = data.length;
			input = palette || pixels;
			i = j = 0;
			if (colors === 1) {
				while (i < length) {
					k = palette ? pixels[i / 4] * 4 : j;
					v = input[k++];
					data[i++] = v;
					data[i++] = v;
					data[i++] = v;
					data[i++] = alpha ? input[k++] : 255;
					j = k;
				}
			} else {
				while (i < length) {
					k = palette ? pixels[i / 4] * 4 : j;
					data[i++] = input[k++];
					data[i++] = input[k++];
					data[i++] = input[k++];
					data[i++] = alpha ? input[k++] : 255;
					j = k;
				}
			}
		};

		PNG.prototype.decode = function() {
			var ret;
			ret = new Uint8Array(this.width * this.height * 4);
			this.copyToImageData(ret, this.decodePixels());
			return ret;
		};

		scratchCanvas = document.createElement('canvas');

		scratchCtx = scratchCanvas.getContext('2d');

		makeImage = function(imageData) {
			var img;
			scratchCtx.width = imageData.width;
			scratchCtx.height = imageData.height;
			scratchCtx.clearRect(0, 0, imageData.width, imageData.height);
			scratchCtx.putImageData(imageData, 0, 0);
			img = new Image;
			img.src = scratchCanvas.toDataURL();
			return img;
		};

		PNG.prototype.decodeFrames = function(ctx) {
			var frame, i, imageData, pixels, _i, _len, _ref, _results;
			if (!this.animation) {
				return;
			}
			_ref = this.animation.frames;
			_results = [];
			for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
				frame = _ref[i];
				imageData = ctx.createImageData(frame.width, frame.height);
				pixels = this.decodePixels(new Uint8Array(frame.data));
				this.copyToImageData(imageData, pixels);
				frame.imageData = imageData;
				_results.push(frame.image = makeImage(imageData));
			}
			return _results;
		};

		PNG.prototype.renderFrame = function(ctx, number) {
			var frame, frames, prev;
			frames = this.animation.frames;
			frame = frames[number];
			prev = frames[number - 1];
			if (number === 0) {
				ctx.clearRect(0, 0, this.width, this.height);
			}
			if ((prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_BACKGROUND) {
				ctx.clearRect(prev.xOffset, prev.yOffset, prev.width, prev.height);
			} else if ((prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_PREVIOUS) {
				ctx.putImageData(prev.imageData, prev.xOffset, prev.yOffset);
			}
			if (frame.blendOp === APNG_BLEND_OP_SOURCE) {
				ctx.clearRect(frame.xOffset, frame.yOffset, frame.width, frame.height);
			}
			return ctx.drawImage(frame.image, frame.xOffset, frame.yOffset);
		};

		PNG.prototype.animate = function(ctx) {
			var doFrame, frameNumber, frames, numFrames, numPlays, _ref,
				_this = this;
			frameNumber = 0;
			_ref = this.animation, numFrames = _ref.numFrames, frames = _ref.frames, numPlays = _ref.numPlays;
			return (doFrame = function() {
				var f, frame;
				f = frameNumber++ % numFrames;
				frame = frames[f];
				_this.renderFrame(ctx, f);
				if (numFrames > 1 && frameNumber / numFrames < numPlays) {
					return _this.animation._timeout = setTimeout(doFrame, frame.delay);
				}
			})();
		};

		PNG.prototype.stopAnimation = function() {
			var _ref;
			return clearTimeout((_ref = this.animation) != null ? _ref._timeout : void 0);
		};

		PNG.prototype.render = function(canvas) {
			var ctx, data;
			if (canvas._png) {
				canvas._png.stopAnimation();
			}
			canvas._png = this;
			canvas.width = this.width;
			canvas.height = this.height;
			ctx = canvas.getContext("2d");
			if (this.animation) {
				this.decodeFrames(ctx);
				return this.animate(ctx);
			} else {
				data = ctx.createImageData(this.width, this.height);
				this.copyToImageData(data, this.decodePixels());
				return ctx.putImageData(data, 0, 0);
			}
		};

		return PNG;

	})();

	window.PNG = PNG;

}).call(this);


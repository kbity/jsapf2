// jsapf2 0.5.1

function headerToData(head) {
  // 44 is comma, 120 is x

  var sect = 0
  var hd = [[]]
  for (byte in head) {
    var byte = head[byte]
    if (byte == 44) {sect++;hd.push([])} else {hd[sect].push(byte)}
  }

  var wh = [[], []]
  var f = 0
  for (byte in hd[0]) {
    var byte = head[byte]
    if (byte == 120) {f++} else {wh[f].push(byte)}
  }

  var wl = wh[0].length
  var hl = wh[1].length

  var w = 0
  var h = 0

  for (v in wh[0]) {
    var v = wh[0][v]
    wl--
    w = w + (v-48)*Math.pow(10, wl)
  }
  for (v in wh[1]) {
    var v = wh[1][v]
    hl--
    h = h + (v-48)*Math.pow(10, hl)
  }

  var ls = 0
  var lsl = hd[2].length

  for (v in hd[2]) {
    var v = hd[2][v]
    lsl--
    ls = ls + (v-48)*Math.pow(10, lsl)
  }

  var ad = 0
  if (hd.length > 4) {
    var adl = hd[4].length

    for (v in hd[4]) {
      var v = hd[4][v]
      adl--
      ad = ad + (v-48)*Math.pow(10, adl)
    }
  }
  // width, height, lineskip, flags, animdelay
  return [w, h, ls, hd[1], ad]
}

function base95_to_num(b95) {
  var out = 0
  var lb95 = b95.length
  for (d in b95) {
    lb95--
    out = out + (b95[d]-32)*Math.pow(95, lb95)
  }
  return out
}

// to n bytes
function hex_to_nums(hex) {
  var out = []
  var cn = -1
  for (n in hex) {
    plc = n%2

    if (plc == 0) {out.push([0]);cn++}

    var num = 0

    if (hex[n] < 58) {num = (hex[n]-48)} else {num = (hex[n]-55)}

    if (plc == 0) {out[cn] = num*16} else {out[cn] = out[cn] + num}
  }
  return out
}

function palette_to_palette(palette, palwid = 7, indlen = 1) {
  var palvals = []
  var opalette = []

  for(var i = 0; i < 95*indlen; i++){
    opalette.push([255, 0, 255])
  }

  var n = -1
  for (val in palette) {
    if (val%palwid == 0) {palvals.push([]);n++}
    palvals[n].push(palette[val])
  }

  for (pind in palvals) {
    var ind = base95_to_num(palvals[pind].slice(0, indlen))
    var col = palvals[pind].slice(indlen, palwid)
    opalette[ind] = hex_to_nums(col)
  }
  return opalette
}

function check_array(ar1, ar2) {
  return (equal = ar1.length === ar2.length && ar1.every((value, index) => value === ar2[index]))
}

function lpalette(obj) {
  var dc = [[]]
  var tn = 0
  var c1 = null
  var c2 = null
  for (l in obj) {
    if (obj[l] == 46) {dc.push([]);tn++} else {
    dc[tn].push(obj[l])}
  }

  if (dc[0].length == 0) {c1 = [0,0,0]} else {
    c1 = hex_to_nums(dc[0])
  }
  if (dc[1].length == 0) {c2 = [255,255,255]} else {
    c2 = hex_to_nums(dc[1])
  }

  return [c1, c2]
}

function unpacktrits(c) {
  r = c%3
  g = Math.floor(c/3)%3
  b = Math.floor(c/9)%3
  a = Math.floor(c/27)%3
  return [r, g, b, a]
}

function dec_a2k(pixmap, dat, indlen, runlength, mode, uncomp, x, y, transmode, ofst, w, h, ls, lf, tm, stp) {
  var nmpap95 = {0: 0, 1: 2, 2: 5, 3: 7, 4: 10, 5: 13, 6: 15, 7: 18, 8: 21, 9: 24, 10: 26, 11: 29, 12: 32, 13: 34, 14: 37, 15: 40, 16: 43, 17: 45, 18: 48, 19: 51, 20: 53, 21: 56, 22: 59, 23: 62, 24: 64, 25: 67, 26: 70, 27: 72, 28: 75, 29: 78, 30: 81, 31: 83, 32: 86, 33: 89, 34: 91, 35: 94, 36: 97, 37: 100, 38: 102, 39: 105, 40: 108, 41: 110, 42: 113, 43: 116, 44: 119, 45: 121, 46: 124, 47: 127, 48: 129, 49: 132, 50: 135, 51: 137, 52: 140, 53: 143, 54: 146, 55: 148, 56: 151, 57: 154, 58: 156, 59: 159, 60: 162, 61: 165, 62: 167, 63: 170, 64: 173, 65: 175, 66: 178, 67: 181, 68: 184, 69: 186, 70: 189, 71: 192, 72: 194, 73: 197, 74: 200, 75: 203, 76: 205, 77: 208, 78: 211, 79: 213, 80: 216, 81: 219, 82: 222, 83: 224, 84: 227, 85: 230, 86: 232, 87: 235, 88: 238, 89: 241, 90: 243, 91: 246, 92: 249, 93: 251, 94: 254};

  for (var i = 0; i < dat.length; i += indlen+runlength) {
    var r = null
    var g = null
    var b = null
    var a = null
    var c = null
    var run = 0

    var cb = null

    if (mode == 3) {r = dat[i]-32; g = dat[i+1]-32; b = dat[i+2]-32; if (uncomp) {run = 1} else { run = dat[i+3]-32}; nmpap95[94] = 255; r = nmpap95[r]; g = nmpap95[g]; b = nmpap95[b]; a = 255}
    if (mode == 4) {r = dat[i]-32; g = dat[i+1]-32; b = dat[i+2]-32; a = dat[i+3]-32; if (uncomp) {run = 1} else { run = dat[i+4]-32}; nmpap95[94] = 255; r = nmpap95[r]; g = nmpap95[g]; b = nmpap95[b]; a = nmpap95[a]}

    if (mode == 5) {r = dat[i]-32; g = dat[i+1]-32; b = dat[i+2]-32; c = dat[i+3]-32; if (uncomp) {run = 1} else { run = dat[i+4]-32};
                      r = nmpap95[r]; g = nmpap95[g]; b = nmpap95[b]; a = 255; cb = unpacktrits(c); r+=cb[0]; g+=cb[1]; b+=cb[2]; if (transmode > 0) {a = [0, 128, 255][cb[3]]}}
    if (mode == 6) {r = dat[i]-32; g = dat[i+1]-32; b = dat[i+2]-32; a = dat[i+3]-32; c = dat[i+4]-32; if (uncomp) {run = 1} else { run = dat[i+5]-32};
                      r = nmpap95[r]; g = nmpap95[g]; b = nmpap95[b]; a = nmpap95[a]; cb = unpacktrits(c); r+=cb[0]; g+=cb[1]; b+=cb[2]; a+=cb[3]}

    if (mode == 7) {g = dat[i]-32; if (uncomp) {run = 1} else { run = dat[i+1]-32}; nmpap95[94] = 255; g = nmpap95[g]; r=g; b=g; a=255}
    if (mode == 8) {g = base95_to_num([dat[i], dat[i+1]]); if (uncomp) {run = 1} else { run = dat[i+2]-32}; r=g; b=g; a=255}

    for (var cr = 0; cr < run; cr++) {
      if (x >= w) {x = 0;y = y-ls;if (y >= h || 0 > y) {ofst++;y = Math.abs(stp-ofst)}}
      pixmap[y][x] = [r, g, b, a]
      if (lf != null && (r+g+b+a == 0 || (tm == true && (r == 255 && g == 0 && b == 255 && a == 255)))) {pixmap[y][x] = lf[y][x]}
      x++
    }
  }
  return pixmap
}

function dec_apf(pixmap, dat, pal, x, y, ofst, w, h, ls, stp) {
  var col = false
  for (var i = 0; i < dat.length; i += 1) {
    var run = dat[i]-32

    for (var r = 0; r < run; r++) {
      if (x >= w) {x = 0;y = y-ls;if (y >= h || 0 > y) {ofst++;y = Math.abs(stp-ofst)}}
      if (col) {
        pixmap[y][x] = pal[1]
      } else {
        pixmap[y][x] = pal[0]
      }
      x++
    }
    col = !(col)
  }
  return pixmap
}

function dec_apf2(pixmap, dat, pal, x, y, ofst, w, h, ls, indlen, runlength, uncomp, lf, stp) {
  for (var i = 0; i < dat.length; i += indlen+runlength) {
    var ind = 0

    if (indlen == 2) {
      ind = base95_to_num([dat[i], dat[i+1]])
    } else {
      ind = dat[i]-32
    }

    var run = 1
    if (!uncomp) {run = dat[i+indlen]-32}

    for (var r = 0; r < run; r++) {
      if (x >= w) {x = 0;y = y-ls;if (y >= h || 0 > y) {ofst++;y = Math.abs(stp-ofst)}}
      pixmap[y][x] = pal[ind]
      if (lf != null && pal[ind][0]+pal[ind][1]+pal[ind][2]+pal[ind][3] == 0) {pixmap[y][x] = lf[y][x]}
      x++
    }
  }
  return pixmap
}

function mkpm(w, h) {
  pixmap = [];
  for (var i = 0; i < h; i++) {
    pixmap.push([])
    for (var o = 0; o < w; o++) {
      pixmap[i].push(null)
    }
  }
  return pixmap;
}

function int_alpha_composit(l1, l2) {
  var a1 = l1[3]
  var a2 = l2[3]

  var r1 = l1[0]
  var r2 = l2[0]
  r1 = r1*(a1-a2)
  r2 = r2*a2

  var g1 = l1[1]
  var g2 = l2[1]
  g1 = g1*(a1-a2)
  g2 = g2*a2

  var b1 = l1[2]
  var b2 = l2[2]
  b1 = b1*(a1-a2)
  b2 = b2*a2

  var ac = a1+Math.floor((a2*(255-a1))/255)
  var rc = (r1+r2) / ac
  var gc = (g1+g2) / ac
  var bc = (b1+b2) / ac

  return [Math.floor(rc), Math.floor(gc), Math.floor(bc), Math.floor(ac)]
}

function composite(frames, w, h) {
  final = frames[0]
  for (var f = 1; f < frames.length; f++) {
    for (var i = 0; i < h; i++) {
      for (var o = 0; o < w; o++) {
        final[i][o] = int_alpha_composit(final[i][o], frames[f][i][o]);
      }
    }
  }
  return [final]
}

function parseAPF2(data) {
  var bytes = new Uint8Array(data);
  var head_1993 = [65,80,69,82,84,85,82,69,32,73,77,65,71,69,32,70,79,82,77,65,84,32,40,99,41,32,49,57,57,51]
  var head_1994 = [65,80,69,82,84,85,82,69,32,73,77,65,71,69,32,70,79,82,77,65,84,32,40,99,41,32,49,57,57,52]
  var head_1985 = [65,80,69,82,84,85,82,69,32,73,77,65,71,69,32,70,79,82,77,65,84,32,40,99,41,32,49,57,56,53]
  var head_2000 = [65,80,69,82,84,85,82,69,32,73,77,65,71,69,32,70,79,82,77,65,84,32,40,99,41,32,50,48,48,48]

  var w = 0
  var h = 0
  var ad = 0
  var pixmap = [] // blank list, [y][x] format

  var line = 0
  var n = [[]]

  // this splits our apf2 into its lines
  for (byte of bytes) {
    if (byte == 10) {line++; n.push([])} else if (byte != 13) {
      n[line].push(byte)
    }
  }

  if (!(check_array(n[0], head_1993)) && !(check_array(n[0], head_1994)) && !(check_array(n[0], head_2000))) {
    if (check_array(n[0], head_1985)) { // upgrade apf to apf2
      var apfh = [51, 50, 48, 120, 50, 48, 48, 44, 108, 44] // 320x200,l,
      n.splice(2, 0, [46]) // . terminator
      n[1] = apfh.concat(n[1])
    } else {throw "Invalid or Unsupported APF2 Image"}
  }

  head = headerToData(n[1])
  w = head[0]
  h = head[1]
  ad = head[4]
  var ls = head[2]
  var flags = head[3]

  var mode = 1
  var transmode = 0
  var indlen = 1
  var flip = false
  var uncomp = false
  var anim = false
  var anic = false
  var tm = false

  if (flags.indexOf(108) !== -1) {mode = 0}
  if (flags.indexOf(105) !== -1) {mode = 1; indlen = 1}
  if (flags.indexOf(100) !== -1) {mode = 2; indlen = 2}
  if (flags.indexOf(116) !== -1) {transmode = 1}
  if (flags.indexOf(97) !== -1) {transmode = 2}

  if (flags.indexOf(113) !== -1) {mode = 3; indlen = 3}
  if (flags.indexOf(110) !== -1) {mode = 4; indlen = 4}
  if (flags.indexOf(84) !== -1) {mode = 5; indlen = 4}
  if (flags.indexOf(65) !== -1) {mode = 6; indlen = 5}
  if (flags.indexOf(103) !== -1) {mode = 7; indlen = 1}
  if (flags.indexOf(71) !== -1) {mode = 8; indlen = 2}

  if (flags.indexOf(117) !== -1) {flip = true}
  if (flags.indexOf(85) !== -1) {uncomp = true}
  if (flags.indexOf(109) !== -1) {anim = true}
  if (flags.indexOf(99) !== -1) {anic = true}
  if (flags.indexOf(77) !== -1) {tm = true}

  var pal = null

  var palwid = 6+indlen
  if (transmode == 2) {
    palwid += 2
  }
  
  if (mode == 1 || mode == 2) {
    pal = palette_to_palette(n[2], palwid, indlen)
  } else if (mode == 0) {
    pal = lpalette(n[2])
  }

  if (transmode == 1 && (mode == 0 || mode == 1 || mode == 2)) {pal[0] = [0, 0, 0, 0]}

  var stp = h-1
  if (flip == true) {ls = 0-ls; stp=0}

  var y = stp
  var x = 0
  var ofst = 0

  var runlength = 1
  if (uncomp) {runlength = 0;}

  // mode, dat (n[3]), indlen, runlength, uncomp, pixmap, pal

  var frames = []

  for (var i = 3; i < n.length; i++) {
    dat = n[i]
    var lf = null
    console.log(anic && i > 3)
    if (anic == true && i > 3) {lf = frames[i-4]}

    if (mode == 1 || mode == 2) { // APF2 paletted color modes
      frame = dec_apf2(mkpm(w, h), dat, pal, x, y, ofst, w, h, ls, indlen, runlength, uncomp, lf, stp)
    } else if (mode == 0) { // APF2 2 color mode
      frame = dec_apf(mkpm(w, h), dat, pal, x, y, ofst, w, h, ls, stp)
    } else if (mode == 3 || mode == 4 || mode == 5 || mode == 6 || mode == 7 || mode == 8) { // APF2 deep modes and gray modes
      frame = dec_a2k(mkpm(w, h), dat, indlen, runlength, mode, uncomp, x, y, transmode, ofst, w, h, ls, lf, tm, stp)
    }
    frames.push(frame)
  }

  if (anim == false && frames.length > 1) {
    frames = composite(frames, w, h)
  }

  return [frames, w, h, ad];
}

// this part is lifted from PolyPixMap
function jsapf2() {
  document.querySelectorAll("img").forEach(async img => {
    if (!img.src.endsWith(".apf2") && !img.src.endsWith(".af2") && !img.src.endsWith(".a2k") && !img.src.endsWith(".ap2k") && !img.src.endsWith(".apf"))
      return;

    var old_src = img.src

    var response = await fetch(img.src);
    var data = await response.arrayBuffer();

    var apf2 = parseAPF2(data);
    var canvas = document.createElement("canvas");
    canvas.width = apf2[1];
    canvas.height = apf2[2];

    var ctx = canvas.getContext("2d");

    if (apf2[0].length > 1) {
      var imageData = [];
      var fc = apf2[0].length;
      var attrs = img.attributes;
      for (var i = 0; i < attrs.length; i++) {
        canvas.setAttribute(attrs[i].name, attrs[i].value);
       }
      img.parentNode.replaceChild(canvas, img);

      for (var f = 0; f < fc; f++) {
        imageData.push(ctx.createImageData(apf2[1], apf2[2]));
        for (var y = 0; y < apf2[2]; y++) {
          for (var x = 0; x < apf2[1]; x++) {
            const i = (y*apf2[1]+x)*4;
            imageData[f].data[i] = apf2[0][f][y][x][0];   // R
            imageData[f].data[i+1] = apf2[0][f][y][x][1]; // G
            imageData[f].data[i+2] = apf2[0][f][y][x][2]; // B
            if (apf2[0][f][y][x].length > 3) {imageData[f].data[i+3] = apf2[0][f][y][x][3]} else {imageData[f].data[i+3] = 255}; // A
          }
        }
      }
      var cf = 0;

      function nextanimframe() {
        ctx.putImageData(imageData[cf], 0, 0);
        cf = (cf+1)%fc
      }
      setInterval(nextanimframe, apf2[3]);

    } else {
      var imageData = ctx.createImageData(apf2[1], apf2[2]);

      for (var y = 0; y < apf2[2]; y++) {
        for (var x = 0; x < apf2[1]; x++) {
          const i = (y*apf2[1]+x)*4;
          imageData.data[i] = apf2[0][0][y][x][0];   // R
          imageData.data[i+1] = apf2[0][0][y][x][1]; // G
          imageData.data[i+2] = apf2[0][0][y][x][2]; // B
          if (apf2[0][0][y][x].length > 3) {imageData.data[i+3] = apf2[0][0][y][x][3]} else (imageData.data[i+3] = 255); // A
        }
      }
      ctx.putImageData(imageData, 0, 0);
      var blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/png")
      );

      img.dataset.orig = old_src;
      img.src = URL.createObjectURL(blob);
    }
  });
};

jsapf2()

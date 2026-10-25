// jsapf2 0.2.3

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

  // width, height, lineskip, flags, animdelay
  return [w, h, ls, hd[1], 0]
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

  for(let i = 0; i < 95*indlen; i++){
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

function parseAPF2(data) {
  var bytes = new Uint8Array(data);
  var head_1993 = [65,80,69,82,84,85,82,69,32,73,77,65,71,69,32,70,79,82,77,65,84,32,40,99,41,32,49,57,57,51]
  var head_1985 = [65,80,69,82,84,85,82,69,32,73,77,65,71,69,32,70,79,82,77,65,84,32,40,99,41,32,49,57,56,53]
  // var head_1994 = [65,80,69,82,84,85,82,69,32,73,77,65,71,69,32,70,79,82,77,65,84,32,40,99,41,32,49,57,57,52] - for future reference

  var w = 0
  var h = 0
  var pixmap = [] // blank list, [y][x] format

  var line = 0
  var n = [[]]

  // this splits our apf2 into its lines
  for (byte of bytes) {
    if (byte == 10) {line++; n.push([])} else if (byte != 13) {
      n[line].push(byte)
    }
  }

  if (!(check_array(n[0], head_1993))) {
    if (check_array(n[0], head_1985)) {
      var apfh = [51, 50, 48, 120, 50, 48, 48, 44, 108, 44] // 320x200,l,
      n.splice(2, 0, [46])
      n[1] = apfh.concat(n[1])
    } // upgrade apf to apf2
  }

  head = headerToData(n[1])
  w = head[0]
  h = head[1]
  var ls = head[2]
  var flags = head[3]

  var mode = 1
  var transmode = 0
  if (flags.indexOf(108) !== -1) {mode = 0}
  if (flags.indexOf(116) !== -1) {transmode = 1;console.log("transparency on")}

  var pal = null
  if (mode == 1) {
    pal = palette_to_palette(n[2])
  }

  if (transmode == 1 && mode == 1) {pal[0] = [0, 0, 0, 0]}

  for (he of Array(h).keys()) {
    pixmap.push([])
    for (wi of Array(w).keys()) {
      pixmap[he].push(null)
    }
  }

  var y = h-1
  var x = 0
  var ofst = 1

  dat = n[3]

  if (mode == 1) { // APF2 95 color mode
    for (let i = 0; i < dat.length; i += 2) {
      var ind = dat[i]-32
      var run = dat[i+1]-32
      for (let r = 0; r < run; r++) {
        if (x >= w) {x = 0;y = y-ls;if (y >= h || 0 > y) {ofst++;y = h-ofst}}
        pixmap[y][x] = pal[ind]
        x++
      }
    }

  } else if (mode == 0) { // APF2 2 color mode
    var col = 0
    for (let i = 0; i < dat.length; i += 1) {
      var run = dat[i]-32
      for (let r = 0; r < run; r++) {
        if (x >= w) {x = 0;y = y-ls;if (y >= h || 0 > y) {ofst++;y = h-ofst}}
        pixmap[y][x] = [col, col, col]
        x++
      }
      if (col == 0) {col = 255} else {col = 0}
    }
  }

  return [pixmap, w, h];
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
    var imageData = ctx.createImageData(apf2[1], apf2[2]);
    for (let y = 0; y < apf2[2]; y++) {
      for (let x = 0; x < apf2[1]; x++) {
        const i = (y*apf2[1]+x)*4;
        imageData.data[i] = apf2[0][y][x][0];   // R
        imageData.data[i+1] = apf2[0][y][x][1]; // G
        imageData.data[i+2] = apf2[0][y][x][2]; // B
        if (apf2[0][y][x].length > 3) {imageData.data[i+3] = apf2[0][y][x][3]} else (imageData.data[i+3] = 255); // A
      }
    }
    ctx.putImageData(imageData, 0, 0);
    var blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/png")
    );

    img.dataset.orig = old_src;
    img.src = URL.createObjectURL(blob);
  });
};

jsapf2()


class SampleAddData {
    constructor() {

    }
    /**
     * 
     * @param {Blob} img 
     * @param {Blob} data 
     * @param {Function} onload
     */
    async add(img, data, onload) {
        let ia = await img.arrayBuffer();
        let id = await data.arrayBuffer();

        ia = new Uint8Array(ia);
        id = new Uint8Array(id);

        let type = data.type;

        let dat = [73, 78, 69, 88, 0];

        dat.push(type.length);
        dat.push(0);

        for (let i = 0; i < type.length; i++) {
            const e = type[i];
            dat.push(e.charCodeAt());
        }

        dat.push(0);

        let sp = new Uint8Array(dat);
        let bl = new Blob([ia, sp, id], { type: "image/png" });

        onload(bl);
    }
     /**
     * 
     * @param {Blob} data 
     * @param {Function} onload
     */
    async parse(data, onload) {
        
        let ar = await data.arrayBuffer();
        ar = new Uint8Array(ar);

        let index = null;

        for (let i = 0; i < ar.length - 4; i++) {
            if (ar[i] == 73 && ar[i + 1] == 78 && ar[i + 2] == 69 && ar[i + 3] == 88) {
                
                index = i;
                break;

            }
        }
        if (index) {
            let mimeIndex = index + 5;
            let mime = "";

            for (let i = 0; i < ar[mimeIndex]; i++) {
                mime += String.fromCharCode(ar[mimeIndex + i + 2]);
            }

            let d = ar.slice(index + ar[mimeIndex] + 8);
            let f = new Blob([d], { type: mime });

            onload(f);
        } else {

            onload(null);

        }
    }
}

class ImgBin {
    constructor() {

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d", { colorSpace: 'srgb' });
        this.isWorking = false;

        this.canvas.addEventListener("contextlost", (event) => {

            this.isWorking = false;

            console.log(event);
        });
    }

    /**
     * 
     * @param {Blob | URL} src url or blob img file
     * @param {Function} onload callback
     */
    createImgMap(src, onload) {
        let img = new Image();
        img.onload = () => {

            this.canvas.width = img.width;
            this.canvas.height = img.height;

            this.ctx.drawImage(img, 0, 0);
            let d = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            let data = d.data;
            this.img = d;
            this.isWorking = true;

            for (let i = 0; i < data.length; i += 4) {
                const e = data[i];

                if (e > 254) {

                    data[i] = 254;

                }
            }
            onload(data);
        }

        img.src = src;
    }


    getSpace() {
        let size = this.canvas.width*this.canvas.height;

        return size;
    }

    /**
     * 
     * @param {Blob} blob 
     * @param {Uint8ClampedArray} imgMap 
     */
    async addData(blob, imgMap) {
        if (!this.isWorking) return false;
        let size = Math.floor(this.getSpace() / 8);
        if ((blob.size + 32) < size) {

            let a = new Uint32Array(1);
            a[0] = blob.size;

            let i8 = new Uint8Array(a.buffer);
            let bin;
            let s = false;

            let buffer = await blob.arrayBuffer();
            buffer = new Uint8Array(buffer);


            for (let i = 0, d = 0, bi = 0; i < imgMap.length; i += 4) {
                
                // add 4 byte for size
                if (!s) {
                    bin = this.toBin(i8[d]);

                    let v = imgMap[i];
                    let pos = i;

                    let b = this.toBin(v);
                    b = b.substring(0, 7) + bin[bi];
                    imgMap[pos] = parseInt(b, 2);
                    bi++;

                    if (bi == 8) {
                        d++;
                        bi = 0;
                        if (d == 4) {

                            s = true;
                            d = 0;
                            continue;

                        }

                        bin = this.toBin(i8[d]);
                    }

                    

                }
                // after add size
                if (s) {
                    let v = imgMap[i];
                    let pos = i;
                    
                    bin = this.toBin(buffer[d]);

                    let b = this.toBin(v);
                    b = b.substring(0, 7) + bin[bi];

                    imgMap[pos] = parseInt(b, 2);
                    bi++;

                    if (bi == 8) {
                        d++;
                        bi = 0;
                        if (d == buffer.length) break;
                        bin = this.toBin(buffer[d]);
                    }
                }
            }
        } else{

            throw new Error("File Too Big For Image:"
                + blob.size + "/" + size
            );

        }
        
        this.ctx.putImageData(new ImageData(imgMap, this.canvas.width, this.canvas.height, { colorSpace: 'srgb' }), 0, 0);

        return true;
    }
    getSize(imgMap) {
        let bin = "";
        let ar = new Uint8Array(4);
        let id = 0;
        let pos = 0;
        for (let i = 0; i < imgMap.length; i += 4) {
            let e = imgMap[i];
            
            bin += this.toBin(e).substring(7, 8);
            if (bin.length == 8) {
                ar[id] = parseInt(bin, 2);
                id++;
                bin = "";
            }

            if (id === 4) {
                pos = i;
                break;
            }
        }
        return { length: ar, pos };
    }
    getData(imgMap) {
        let { length, pos } = this.getSize(imgMap);
        let bin = "";
        let size = length[0] + (length[1] << 8) + (length[2] << 16);
        let ar = new Uint8Array(size);
        let id = 0;
        for (let i = pos+4; i < imgMap.length; i += 4) {
            if (i >= length) break;

            let e = imgMap[i];

            
            bin += this.toBin(e).substring(7, 8);
            if (bin.length == 8) {
                ar[id] = parseInt(bin, 2);
                id++;
                bin = "";
            }
            if (id === size) break;
        }
        return ar;
    }
    toBin(num) {
        let d = num.toString(2);
        let n = 8 - d.length;
        if (n > 0) {
            for (let i = 0; i < n; i++) {
                d = "0" + d;
            }
        }
        return d;
    }
}

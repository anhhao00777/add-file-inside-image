let r_thumb = document.getElementById("r-thumb"); // right
let l_thumb = document.getElementById("l-thumb"); // left

let out_img = document.querySelector("#out-img"); // right
let inp_img = document.querySelector("#in-img"); // left

let inp_file = document.querySelector("#in-file"); // left

let img_s; // left img
let img_r; // right img

let pl = document.querySelector("#px-mode"); // pixel mode on left
let pr = document.querySelector("#px-mode-out"); // pixel mode on right


inp_img.addEventListener("change", function(){

    if(this.files[0]){

        let u = URL.createObjectURL(this.files[0]);
        l_thumb.src = u;
        img_s = this.files[0];

    }
});

out_img.addEventListener("change", function(){
    if(this.files[0]){

        let u = URL.createObjectURL(this.files[0]);
        r_thumb.src = u;

        let dl = document.querySelector("#down");

        if (pr.checked) {

            let k = new ImgBin();
            k.createImgMap(u, (d) => {

                let p = k.getData(d);
                let u = new Blob([p], { type: "image/png" });
                let url = URL.createObjectURL(u);

                let img = document.querySelector("#out-res");

                img.src = url;
                img.style.display = "";
                
                dl.href = url;
                dl.style.display = "";

            });

            return;
        }

        let c = new SampleAddData();
        c.parse(this.files[0], (f)=>{

            let img = document.querySelector("#out-res");
            let vid = document.querySelector("#vid");

            img.src = ""; vid.src = "";
            img.style.display = "none"; vid.style.display = "none";

            let url = URL.createObjectURL(f);

            if(f.type.indexOf("video/") !== -1 || f.type.indexOf("audio/") !== -1){
                vid.src = url;
                vid.style.display = "";
            } else if(f.type.indexOf("image/") !== -1){
                img.src = url;
                img.style.display = "";
            }

            dl.href = url;
            dl.style.display = "";

        });
    }
});


document.querySelector("#add-data").addEventListener("click", ()=>{

    if(!img_s) {
        alert("Missing Image File");
        return;
    }
    if(!inp_file.files[0]) {
        alert("Missing File");
        return;
    }

    if (pl.checked) {
        let k = new ImgBin();
        k.createImgMap(URL.createObjectURL(img_s), (d) => {
            k.addData(inp_file.files[0], d).then(e =>{

                if (e) {
                    k.canvas.toBlob(b => {
                        b.down("file in img.png");
                    });
                } else {
                    alert("Something wrong");
                }

            }).catch(er => {

                alert(er);

            });
            
        });
        return;
    }

    let c = new SampleAddData();
    c.add(img_s, inp_file.files[0], (a)=>{
        a.down("file in img.png");
    });

});

// for fast download blob
Blob.prototype.down = function (name) {
    let u = URL.createObjectURL(this);
    let a = document.createElement("a");
    a.setAttribute("download", name);
    a.setAttribute("target", "_blank");
    a.href = u;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

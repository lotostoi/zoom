window.onload = () => {
    let d = document

    let socket = io.connect();

    let mousemove = true

    let mous = `<div class='mous'>                                                                     
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40px" height="40px"><path fill="#dff0fe" d="M17.708 24.645L10.5 30.556 10.5 2.173 30.899 21.749 21.679 22.932 27.505 36.627 23.534 38.342z"/><path fill="#4788c7" d="M11,3.346l18.799,18.04l-7.529,0.966l-1.31,0.168l0.517,1.215l5.373,12.63l-3.052,1.318 l-5.369-12.62l-0.522-1.228l-1.032,0.846L11,29.499V3.346 M10,1v30.612l7.509-6.157L23.271,39l4.889-2.111l-5.762-13.545L32,22.112 L10,1L10,1z"/></svg>
                </div>`
    d.querySelector('body').innerHTML += mous
    mous = d.querySelector('.mous')

    let initialized = [];

    function Magnify(el, opts, i) {
        let anchor;
        if (!~initialized.indexOf(el)) {
            initialized.push(el);

            this.opts = opts;
            this.image = anchor = el;

            // Detect closest anchor
            while (anchor) {
                if (anchor.tagName === 'A') {
                    break;
                }
                anchor = anchor.parentElement;
            }
            this.alter = el.getAttribute('data-magnify-src')
                || (anchor && anchor.getAttribute('href'))
                || opts.src
                || '';

            this.wrap(i);

            this.zoom(i);
        }
    }

    Magnify.prototype = {
        wrap: function (i) {
            let inst = this,
                image = inst.image,
                container, lens;

            container = document.createElement('div');
            container.className = 'magnify';
            container.setAttribute('data-id', i);

            lens = document.createElement('div');
            lens.className = 'magnify-lens magnify-loading';
            lens.setAttribute('data-lens', i);
            lens.style.transitionDuration = inst.opts.speed + 'ms';
            lens.style.webkitTransitionDuration = inst.opts.speed + 'ms';

            // Append
            container.appendChild(lens);
            image.parentNode.insertBefore(container, image);
            container.appendChild(image);

            inst.container = container;
            inst.lens = lens;

        },

        zoom: function (i) {
            let inst = this,
                container = inst.container,
                lens = null,
                img = inst.image,
                mImg = new Image(),
                loaded = false,
                errored = false,
                mous = d.querySelector('.mous')

            container.addEventListener('mouseover', function (e) {

                socket.emit('mouseover_soket', container.dataset.id)

            });
            container.addEventListener('touchstart', function (e) {
                if (e.pointerType == "touch" && !e.isPrimary) {
                    return
                }
                socket.emit('touchstart_soket', container.dataset.id)

            });

            socket.on('touchstart_soket_server', (data) => {

                if (!errored) {
                    mImg.src = inst.alter;
                }
                if (socket.id != data.id) {
                    lens = d.querySelector(`div[data-lens = "${data.data}"]`)
                    lens.style.opacity = 1;
                    mousemove = false
                    mous.style.opacity = 0
                } else {
                    mous.style.opacity = 0;
                }
            })
            socket.on('mouseover_soket_server', (data) => {
                if (!errored) {
                    mImg.src = inst.alter;
                }
                if (socket.id != data.id) {
                    lens = d.querySelector(`div[data-lens = "${data.data}"]`)
                    lens.style.opacity = 1;
                    mousemove = false
                    mous.style.opacity = 0
                } else {
                    mous.style.opacity = 0;
                }
            })

            container.addEventListener('mouseleave', function (e) {

                socket.emit('mouseleave_soket', container.dataset.id)
            });

            container.addEventListener('touchend', function (e) {

                if (e.pointerType == "touch" && !e.isPrimary) {
                    return
                }

                socket.emit('touchend_soket', container.dataset.id)
            });


            socket.on('mouseleave_soket_server', (data) => {
                if (socket.id != data.id) {
                    lens.style.opacity = 0;
                    mousemove = true
                    mous.style.opacity = 1
                } else {
                    mous.style.opacity = 0;
                }

            })

            socket.on('touchend_soket_server', (data) => {
                if (socket.id != data.id) {
                    lens.style.opacity = 0;
                    mousemove = true
                    mous.style.opacity = 1
                } else {
                    mous.style.opacity = 0;
                }

            })

            container.addEventListener('mousemove', function (e) {
                let box = d.querySelector(`div[data-id = "${i}"]`).getBoundingClientRect(),
                    clientX = e.clientX - 10,
                    clientY = e.clientY - 10;
          
                socket.emit('mousemove_soket', {
                    box: box,
                    clientX: clientX,
                    clientY: clientY,
                    vueportW: d.body.clientWidth,
                    vueportH: d.body.clientHeight,
                })
            })

            // Graceful degradation
            socket.on('mousemove_soket_server', (data) => {
                if (socket.id != data.id) {
                    let box = d.querySelector(`div[data-id = "${i}"]`).getBoundingClientRect(),

                        kw = d.body.clientWidth / data.data.vueportW,
                        kh = d.body.clientHeight / data.data.vueportH,

                        clientX = data.data.clientX * kw,
                        clientY = data.data.clientY * kh;

        
                    // Will always true with pointer-events: none
                    if (clientX > box.left && box.right > clientX && clientY > box.top && box.bottom > clientY) {
                        calc(clientX, clientY, box.left, box.top)
                        // show
                        lens.style.opacity = 1;
                        // container.style.overflow = '';
                    } else {
                        // hide
                        lens.style.opacity = 0;
                        //  container.style.overflow = 'hidden';
                    }
                } else {
                    mous.style.opacity = 0;
                }
            })

            container.addEventListener('touchmove', function (e) {
                e.preventDefault()
                if (e.pointerType == "touch" && !e.isPrimary) {
                    return
                }
              
                let box = d.querySelector(`div[data-id = "${i}"]`).getBoundingClientRect(),
                    clientX = e.touches[0].clientX - 10,
                    clientY = e.touches[0].clientY - 10;
         
                socket.emit('touchmove_soket', {
                    box: box,
                    clientX: clientX,
                    clientY: clientY,
                    vueportW: d.body.clientWidth,
                    vueportH: d.body.clientHeight,
                    i: i
                })


            })

            // Graceful degradation
            socket.on('touchmove_soket_server', (data) => {

                if (socket.id != data.id) {
                    let box = d.querySelector(`div[data-id = "${data.data.i}"]`).getBoundingClientRect(),
                        clientX = data.data.clientX * d.body.clientWidth / data.data.vueportW,
                        clientY = data.data.clientY * d.body.clientHeight / data.data.vueportH;
                  
           
                    // Will always true with pointer-events: none
                    if (clientX > box.left && box.right > clientX && clientY > box.top && box.bottom > clientY) {
                        calc(clientX, clientY, box.left, box.top)
                        // show
                        lens.style.opacity = 1;
                        // container.style.overflow = '';
                    } else {
                        // hide
                        lens.style.opacity = 0;
                        //  container.style.overflow = 'hidden';
                    }
                } else {
                    mous.style.opacity = 0;
                }
            })

            function calc(clientX, clientY, left, top) {
                let x, y, lhw, lhh, rx, ry;
                // coords
                x = clientX - left;
                y = clientY - top;
                // lens half
                lhw = lens.offsetWidth / 2
                lhh = lens.offsetHeight / 2
                // lens pos
                lens.style.left = x - lhw + 'px';
                lens.style.top = y - lhh + 'px';
                // ratio
                if (loaded) {
                    rx = Math.round(x / img.width * mImg.width - lhw) * -1;
                    ry = Math.round(y / img.height * mImg.height - lhh) * -1;
                    lens.style.backgroundPosition = rx + 'px ' + ry + 'px';
                }
            }

            mImg.addEventListener('load', function () {
                socket.emit('load_soket')
            });

            socket.on('load_soket_server', (data) => {
                if (socket.id != data.id) {
                    loaded = true;
                    if (lens) {
                        lens.className = 'magnify-lens';
                        lens.style.background = 'url(' + inst.alter + ') no-repeat';
                    }

                }
            })

            mImg.addEventListener('error', function () {
                errored = true;
                lens.className = 'magnify-lens magnify-error';
            });
        }
    };

    window.magnify = function (el, opts) {
        let i;

        if (typeof el === 'string') {
            el = d.querySelectorAll(el);
        } else if (typeof el === 'object' && el.nodeType) {
            el = [el];
        } else if (!el.length) {
            el = [];
        }

        // Options
        if (typeof opts !== 'object') {
            opts = {};
        }
        opts.src = opts.src || '';
        opts.speed = opts.speed || 200;

        // Iterator
        if (el.length) {
            for (i = el.length - 1; i != -1; i -= 1) {
                if (el[i].nodeType) {
                    new Magnify(el[i], opts, i)
                }
            }
        }
    };


    magnify(d.querySelectorAll('.zoom'),
        {
            speed: 100,
        }
    );


    d.querySelector('#test').addEventListener('click', (e) => {
        socket.emit('clickTest', e.target.id)

    })



    socket.on('kk', (data) => {
        d.querySelector(`#${data.id}`).classList.toggle('test')
    })

    if (mousemove) {
        d.querySelector('body').addEventListener('mousemove', (e) => {

            socket.emit('mous active', { x: e.pageX, y: e.pageY })
        })

        socket.on('sendMous', (data) => {
            if (socket.id != data.id) {

                if (d.querySelector('.mous')) {

                    d.querySelector('.mous').style.left = `${data.cor.x - 10}px`
                    d.querySelector('.mous').style.top = `${data.cor.y - 10}px`
                }
            }
            else {
                if (mous) {
                    mous.style.opacity = 0;
                }

            }
        })

    }

}
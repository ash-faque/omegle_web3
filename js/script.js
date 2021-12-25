
const
    loader = document.getElementById('loader'),
    logs_ul = document.getElementById('logs'),

    qoute_display = document.getElementById('qoute_text'),

    video_panal = document.getElementById('videos'),
    peer_video = document.getElementById('peer'),
    other_peer_video = document.getElementById('other_peer'),

    connect_panal = document.getElementById('connect'),
    connect_form = document.getElementById('connect_form'),
    peer_id_text = document.getElementById('outgoing'),
    
    chat_panal = document.getElementById('chat'),
    chat_ul = document.getElementById('messages'),
    chat_form = document.getElementById('draft_message'),
    
    peer_list_display = document.getElementById('peers'),
    
    info_fill_form = document.getElementById('info_fill'),
   
    page_title = document.querySelector('title');

// for updating to gdb
let my_peer_id = '';

let just_aimed_target = null;

// show time on title
setInterval(() => {
    page_title.innerHTML = (new Date()).toLocaleString();
}, 1000);


// logger function
function log(msg = "", status = 0){
    let color = '#000';
    switch(status){
        case 1: 
            color = '#1b7200';
            break;
        case 2:
            color = '#bb7900';
            break;
        case 3:
            color = '#d30000';
            break;
    };
    let li = document.createElement('li');
    li.style.color = color;
    li.innerHTML = `<mark>${(new Date()).toLocaleTimeString()}</mark>
                        ${msg.toString()}`;
    logs_ul.appendChild(li)
    li.scrollIntoView()
};

// gun time formatter helper
// function msToTime(s) {
//     // Pad to 2 or 3 digits, default is 2
//     function pad(n, z) {
//       z = z || 2;
//       return ('00' + n).slice(-z);
//     }
//     var ms = s % 1000;
//     s = (s - ms) / 1000;
//     var secs = s % 60;
//     s = (s - secs) / 60;
//     var mins = s % 60;
//     var hrs = (s - mins) / 60;
//     return pad(hrs) + ':' + pad(mins) + ':' + pad(secs)/*  + '.' + pad(ms, 3) */;
// };

// gun init
let gun_relay = 'https://gun-relay-server-0.herokuapp.com/gun';
// gun_relay = '';
const gun = Gun([gun_relay]);
const peers_list = gun.get('peers_list');

// data listener
peers_list.map().on((data, id) => {
    // console.log(id, data);
    
    if (id === my_peer_id) return;

    let already = document.getElementById(id);
    if (already) already.remove();

    if (data){
        let li = document.createElement('li');
        li.setAttribute('id', id)
        li.innerHTML = `<mark>${(new Date(data)).toLocaleTimeString()}</mark>&nbsp${id}`;
        li.setAttribute('onclick', `connect('${id}')`);
        peer_list_display.appendChild(li);
        li.scrollIntoView();
    };
});


// updat gun db
const updateGunDb = (isAvailable = true) => {
    if (!PEER.open || !my_peer_id.length) return;
    let updation_time = (Date.now());
    try{
        if (peers_list.get(my_peer_id)){
            peers_list.get(my_peer_id).put(isAvailable ? updation_time : null);
        }
        // console.log('Signed connection id to gdb')
        log('Signed connection id to gdb')
    } catch(e){
        console.log(e)
        log('GDB Error:  ', e)
    }
}; 



// GET a stream locally
// get stream
let local_stream = null;
navigator.mediaDevices.getUserMedia( {
    audio: true,
    video: true
}).then(stream => {
    log("AV Stream initiated succesfully", 1);
    local_stream = stream;
    peer_video.srcObject = stream;
    peer_video.muted = true;
    peer_video.volume = 0;
    peer_video.play();
})
.catch(err => {
    log("AV Stream failed to initiat" + err, 3);
    console.log(err)
});



// initiate this peer
let PEER = new Peer();

PEER.on('error', e => {
    loader.style.display = 'none';

    switch(e.type){
        case 'browser-incompatible':
            log('browser-incompatible', 3)
            console.log('browser-incompatible')
            break;
        case 'disconnected':
            log('disconnected', 3)
            console.log('disconnected')
            break;
        case 'invalid-id':
            peers_list.get(just_aimed_target).put(null);
            log('invalid-id', 3)
            console.log('invalid-id')
            break;
        case 'invalid-key':   
            peers_list.get(just_aimed_target).put(null);
            log('invalid-key', 3)
            console.log('invalid-key')
            break;
        case 'network':
            log('network')
            console.log('network')
            break;
        case 'peer-unavailable':
            peers_list.get(just_aimed_target).put(null);
            log('peer-unavailable')
            console.log('peer-unavailable')
            break;
        case 'ssl-unavailable':
            log('ssl-unavailable')
            console.log('ssl-unavailable')
            break;
        case 'server-error':
            log('server-error')
            console.log('server-error')
            break;
        case 'socket-error':
            log('socket-error')
            console.log('socket-error')
            break;
        case 'socket-closed':
            log('socket-closed')
            console.log('socket-closed')
            break;
        case 'unavailable-id':
            log('unavailable-id')
            console.log('unavailable-id')
            break;
        case 'webrtc':
            log('webrtc')
            console.log('webrtc')
            break;
        default:
            log('Unrated Error')
            console.log('Unrated Error')
            break;
    };

    console.log("Peer error: " + e);
    log("Peer error: " + e, 3);
});



// on open show peer id
PEER.on('open', id => {
    loader.style.display = 'none';

    my_peer_id = id;
    peer_id_text.value = id;
    updateGunDb();

    log("Peer connection opeed with id: " + id, 1);
    log("See the 'Others to connect' tab to connect other people");

    // if is a shared link
    if (location.hash && location.hash.length > 8){
        connect_form.scrollIntoView();
        connect_form[0].value = location.hash;
        setTimeout(connect_form.submit(), 3000);
    };
});

PEER.on('close', () => {
    log("Peer connection closed. You may reload.", 3);
    console.log('closed')
});

PEER.on('disconnected', () => {
    log("Peer disconnected. You may reload.", 3);
    console.log('disconnected')
});


// handling submition of target peer id
let CONN = null;
let CALL = null;

function connectToPeer(){
    let other_peers_id = connect_form[0].value;
    if (!other_peers_id) return;

    just_aimed_target = other_peers_id;

    console.log('triying ' + other_peers_id)
    log('Triying to call peer ' + other_peers_id, 2);

    ////////////////
    CONN = PEER.connect(other_peers_id);
    CONN.on('open', () => {
        log('Connected on data channel of ' + other_peers_id, 1);
        isOnCall = true;
        CONN.send(["PEER_ID", peer_id_text]);
    });
    CONN.on('error', e => {
        log('Datachannel error ' + e, 3);
        console.log(e)
    });
    CONN.on('data', data => {
        ON_DATA(data)
    });

    //////////////
    CALL = PEER.call(other_peers_id, local_stream);
    CALL.on('stream', stream => {
        other_peer_video.srcObject = stream;
        other_peer_video.play()
            .catch(e => console.log(e));
    });
    CALL.on('error', e => {
        log('Call channel error ' + e, 3);
        console.log(e)
    });

    connect_form.reset();
};


// on getting data connection
PEER.on('connection', IN_CONN => {

    log('Incomming data connection request ', 2);
    CONN = IN_CONN;
    
    isOnCall = true;
    IN_CONN.on('data', data => {
       ON_DATA(data)
    });
});

// on data
const ON_DATA = (data) => {
    if (typeof(data) === 'String'){

        console.log(data);

    } else {

        switch(data[0]){
            case "PEER_ID":
                console.log(data[1])
                break; 
            case "MESSAGE":
                console.log(data[1])
                break; 
              
        };

    };
};



// on getting call
PEER.on('call', IN_CALL => {

    log('Incomming call request ', 2);
    CALL = IN_CALL;
    isOnCall = true;

    IN_CALL.answer(local_stream);
    log('Accepted incomming call ', 1);

    IN_CALL.on('stream', stream => {
        other_peer_video.srcObject = stream;
        other_peer_video.play()
            .catch(e => console.log(e));;
    });

});





// UI functions
// on connect function
function connect(target_pid){
    just_aimed_target = target_pid;
    connect_form[0].value = target_pid;
    connect_form.querySelector('button').click();
};


// copey function
function copeyPeerId() {
    /* Select the text field */
    peer_id_text.select();
    peer_id_text.setSelectionRange(0, 99999); /* For mobile devices */
  
     /* Copy the text inside the text field */
    navigator.clipboard.writeText(peer_id_text.value);
  
    /* Alert the copied text */
    // alert("Copied peer id: " + peer_id_text.value);
};


// share function
async function sharePeerId (){
    const shareData = {
        title: 'Ohm gle',
        text: 'Cum oon monoose, lets party',
        url: location.protocol + '//' + location.host + '#' + my_peer_id
    };

    try {
        await navigator.share(shareData);  
    } catch(err) {
        resultPara.textContent = 'Error: ' + err;
    };
};





// chat functions
chat_form.onsubmit = (ev) => {
    ev.preventDefault();
    let msg = chat_form.message_text.value;
    if (!msg) {
        console.log('ooo mt')
        return;
    };
    let li = document.createElement('li');
    li.classList.add('me');
    li.innerText = msg;
    chat_ul.appendChild(li);
    li.scrollIntoView();
    chat_form.reset();
    // send to peer

};
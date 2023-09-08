// common data

// CMD
const PROTO_CMD = {
    HELLO: 0,
    LCC_ADVERTISEMENT: 1,
    DEV_ADVERTISEMENT: 2,
    CONNECT: 3,
    COMFIRM: 4,
    REJECT: 5,
    CONTROL: 6,
    REQ_DEVLIST: 7,
}

// common
const MAX_MSG_SIZE = 64

// cloud server IP address
const CLOUD_IP_ADDR = ""
// local proxy IP address
const LOCAL_PROXY_IP_ADDR = ""
// cloud domain name
const CLOUD_DOMAIN_NAME = ""
const CLOUD_DOMAIN_NAME_2 = ""

// cloud port
const CLOUD_TCP_PORT = 13000
const CLOUD_UDP_PORT = 12000

// Proxy port
// const PROXY_TCP_PORT = 14980
const LOCAL_TCP_PORT = 11000

// local control center
const BROADCAST_UDP_PORT = 12650
const COMMUNICATION_UDP_PORT = 12651

// alloc device data struct
function allocDevData() {
    return {
        id: 0,
        name: 'N/A',
        is_online: false,
        ip_addr: '0.0.0.0',
        last_update_time: 'N/A',
        pin_set: Array(20).fill(0),
    }
}

function uint8ArrayToString(byte_arr) {
    var str = "";
    for (var i = 0; i < byte_arr.length; i++) {
        str += String.fromCharCode(byte_arr[i]);
    }

    return str
}

// module.exports.PROTO_CMD = PROTO_CMD;
// module.exports.MAX_MSG_SIZE = MAX_MSG_SIZE;

// ES6
export {
    PROTO_CMD,
    MAX_MSG_SIZE,
    CLOUD_IP_ADDR,
    LOCAL_PROXY_IP_ADDR,
    CLOUD_DOMAIN_NAME,
    CLOUD_DOMAIN_NAME_2,
    CLOUD_TCP_PORT,
    CLOUD_UDP_PORT,
    // PROXY_TCP_PORT,
    LOCAL_TCP_PORT,
    BROADCAST_UDP_PORT,
    COMMUNICATION_UDP_PORT,
    allocDevData,
    uint8ArrayToString,
};
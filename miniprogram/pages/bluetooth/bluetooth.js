// pages/bluetooth/bluetooth.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        dev_list: []
    },

    getDevByUid(uid) {
        var list = this.data.dev_list;
        for (var v of list) {
            if (v.deviceId == uid)
                return v;
        }
    },

    enableBT() {
        // 监听扫描到新设备事件
        wx.onBluetoothDeviceFound((res) => {
            var need_update = false;
            res.devices.forEach((device) => {
                // 这里可以做一些过滤
                console.log('Device Found', device);
                if (device.name == "ESP32_Node") {
                    var dev = this.getDevByUid(device.deviceId);
                    if (dev)
                        dev.RSSI = device.RSSI;
                    else
                        this.data.dev_list.push(device);

                    need_update = true;
                }

            })

            if (need_update) {
                this.setData({
                    dev_list: this.data.dev_list
                });
            }

        })

        // 初始化蓝牙模块
        wx.openBluetoothAdapter({
            mode: 'central',
            success: (res) => {
                // 开始搜索附近的蓝牙外围设备
                wx.startBluetoothDevicesDiscovery({
                    allowDuplicatesKey: false,
                    interval: 1000
                })
            },
            fail: (res) => {
                if (res.errCode !== 10001) return
                wx.onBluetoothAdapterStateChange((res) => {
                    if (!res.available) return
                    // 开始搜寻附近的蓝牙外围设备
                    wx.startBluetoothDevicesDiscovery({
                        allowDuplicatesKey: false,
                        interval: 1000
                    })
                })
            }
        });


    },

    searchBTDev() {
        this.enableBT();
    },

    // ArrayBuffer转16进制字符串示例
    ab2hex(buffer) {
        let hexArr = Array.prototype.map.call(
            new Uint8Array(buffer),
            function (bit) {
                return ('00' + bit.toString(16)).slice(-2)
            }
        )
        return hexArr.join('');
    },

    connectBTDev(e) {
        var dev_uid = e.currentTarget.dataset.devUid;
        console.log("connect to BT dev ", typeof dev_uid);
        wx.createBLEConnection({
            deviceId: dev_uid, // 搜索到设备的 deviceId
            success: () => {
                // 连接成功，获取服务
                console.log("BT device connect successfully, get device services");

                wx.onBLECharacteristicValueChange((res) => {
                    console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
                    console.log(this.ab2hex(res.value))
                })

                wx.getBLEDeviceServices({
                    deviceId: dev_uid,
                    success: (res) => {
                        res.services.forEach((service) => {
                            console.log("service uuid: ", service.uuid)
                            console.log("is Primary: ", service.isPrimary);

                            wx.getBLEDeviceCharacteristics({
                                deviceId: dev_uid,
                                serviceId: service.uuid,
                                success: (res) => {
                                    var char_list = [];
                                    res.characteristics.forEach((char) => {
                                        console.log("properties uuid: ", char.uuid)
                                        console.log("properties support: ", char.properties)
                                        wx.notifyBLECharacteristicValueChange({
                                            state: true, // 启用 notify 功能
                                            // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
                                            deviceId: dev_uid,
                                            // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
                                            serviceId: service.uuid,
                                            // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
                                            characteristicId: char.uuid,
                                            success(res) {
                                                console.log('notifyBLECharacteristicValueChange success', res.errMsg)
                                            }
                                        })

                                        char_list.push({
                                            service_id: service.uuid,
                                            uuid: char.uuid,
                                            properties: char.properties
                                        })
                                        console.log("char.properties: ", char.properties)
                                    })

                                    char_list.forEach((obj) => {
                                        // wx.readBLECharacteristicValue({
                                        //     deviceId: dev_uid,
                                        //     serviceId: obj.service_id,
                                        //     characteristicId: obj.uuid,
                                        //     success: (res) => {
                                        //         console.log('readBLECharacteristicValue:', res);
                                        //     }
                                        // })
                                        // write requset
                                        let buffer = new ArrayBuffer(8)
                                        let dataView = new DataView(buffer)
                                        dataView.setUint8(0, 255)
                                        dataView.setUint8(1, 255)
                                        dataView.setUint8(2, 255)
                                        dataView.setUint8(3, 255)
                                        wx.writeBLECharacteristicValue({
                                            deviceId: dev_uid,
                                            serviceId: obj.service_id,
                                            characteristicId: obj.uuid,
                                            value: buffer,
                                            writeType: 'write',
                                            success: (res) => {

                                            }
                                        })
                                    })
                                },
                                fail: (err) => {
                                    console.log("getBLEDeviceCharacteristics err: ", err);
                                }
                            })
                        })
                    },
                    fail: (err) => {
                        console.log("getBLEDeviceServices err: ", err);
                    }
                })


            },
            fail: (errcode) => {
                console.log("BLE Connect err!");
                console.log(errcode);
            }
        })

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        wx.stopBluetoothDevicesDiscovery();
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        wx.stopBluetoothDevicesDiscovery();
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})
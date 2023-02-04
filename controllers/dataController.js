const cron = require('node-cron');
const moment = require('moment-timezone');

const DeviceType = require('../models/DeviceType');
const House = require('../models/House');
const Device = require('../models/Device');

const dataController = {
    // RANDOM DATA
    randomAndSaveData: async () => {
        const typesD = [
            { type_name: 'Temp', min: 13, max: 32, diff: 3 },
            { type_name: 'Humi', min: 35, max: 65, diff: 5 },
            { type_name: 'Oxi', min: 18, max: 32, diff: 5 },
            { type_name: 'Sun', min: 4800, max: 9200, diff: 1000 },
        ];

        const prevRandom = {
            temp: null,
            humi: null,
            oxi: null,
            sun: null,
        };

        const randomFakeData = (type) => {
            let random = Math.floor(Math.random() * (type.max - type.min + 1) + type.min);
            if (prevRandom[type.type_name]) {
                while (Math.abs(random - prevRandom[type.type_name]) > type.diff) {
                    random = Math.floor(Math.random() * (type.max - type.min + 1) + type.min);
                }
            }
            prevRandom[type.type_name] = random;
            return random;
        };

        // Lay ra cac thiet bi theo tung ngoi nha
        const houseDevices = await House.find({}).select('device_types').populate({
            path: 'device_types',
            modal: 'DeviceType',
            select: 'devices type_name min max',
        });

        cron.schedule('0 * * * *', () => {
            houseDevices.forEach((houseDevice) => {
                houseDevice.device_types.map(async (type) => {
                    //  Random tung thiet bi va tinh trung binh cong luu vao loai thiet bi
                    // O day co min max
                    if (type.devices.length > 0) {
                        const typeD = typesD.find((typeD) => typeD.type_name === type.type_name);
                        const medium =
                            (await Promise.all(
                                type.devices.map(async (device) => {
                                    const randomData = randomFakeData(typeD);
                                    console.log(device + ' Random: ' + randomData);
                                    const updateDevice = await Device.findByIdAndUpdate(device, { data: randomData });

                                    // Check neu random data vuot nguong an toan thi them event
                                    if (randomData < type.min || randomData > type.max) {
                                        await House.findOneAndUpdate(
                                            { device_types: { $in: [type._id] } },
                                            {
                                                $push: {
                                                    events: {
                                                        message: `Cảnh báo thiết bị ${updateDevice.name} đo ${
                                                            randomData < type.min ? 'thấp hơn' : 'vượt'
                                                        } ngưỡng an toàn!`,
                                                        created_at: Date.now(),
                                                    },
                                                },
                                            }
                                        );
                                    }
                                    return randomData;
                                })
                            ).then((values) => values.reduce((total, value) => total + value, 0))) /
                            type.devices.length;

                        const mediumConvert = parseFloat(medium.toFixed(1)); // Lay 1 chu so sau dau phay
                        console.log(`Medium ${type._id} ${type.type_name}: ${mediumConvert}`);

                        await DeviceType.findByIdAndUpdate(type._id, {
                            $push: { datas: { data: mediumConvert, created_at: new Date() } },
                        });
                    }
                });
            });
        });
    },

    // GET DEVICE DATA
    getDeviceData: async (req, res) => {
        try {
            const houseData = await House.findById(req.params.houseId).populate({
                path: 'device_types',
                model: 'DeviceType',
                select: { datas: { $slice: -10 } }, // Lay ra 10 data do duoc moi nhat
            });

            const deviceData = houseData.device_types.map((deviceTypeData) => {
                const { _id, type_name, datas, ...other } = deviceTypeData._doc;
                const newDatas = datas.map((data) => {
                    const vnTime = moment.tz(data.created_at, 'Asia/Ho_Chi_Minh').format('HH:mm DD-MM-YYYY');
                    return { ...data._doc, created_at: vnTime };
                });
                return { _id, type_name, datas: newDatas };
            });

            const currentData = deviceData.map((deviceData) => {
                const { _id, type_name, datas } = deviceData;
                return { _id, type_name, data: datas[datas.length - 1] };
            });

            return res.status(200).json({ success: true, currentData, deviceData });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },
};

module.exports = dataController;

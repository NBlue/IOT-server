const cron = require('node-cron');
const moment = require('moment-timezone');

const DeviceType = require('../models/DeviceType');
const House = require('../models/House');
const Device = require('../models/Device');

const dataController = {
    // RANDOM DATA
    randomAndSaveData: async () => {
        const types = [
            { type_name: 'Temp', min: 15, max: 30, diff: 2 },
            { type_name: 'Humi', min: 40, max: 60, diff: 2 },
            { type_name: 'Oxi', min: 20, max: 30, diff: 2 },
            { type_name: 'Sun', min: 5000, max: 9000, diff: 100 },
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

        // Random Data
        cron.schedule('0 * * * *', () => {
            for (let type of types) {
                const randomData = randomFakeData(type);

                // Code to update the 'datas' array in DeviceType model
                DeviceType.updateMany(
                    { type_name: type.type_name },
                    { $push: { datas: { data: randomData, create_at: new Date() } } },
                    (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Fake data is successfully!');
                        }
                    }
                );
            }
        });

        // Random Event
        cron.schedule('0 8,16 * * *', () => {
            // Random 1 thiet bi ngau nhien de them event
            const titleArr = ['OXI', 'ND', 'DA', 'SUN'];
            const randomIndex = Math.floor(Math.random() * titleArr.length);
            const randomType = titleArr[randomIndex];

            const randomNumber = Math.floor(Math.random() * 5);

            const deviceName = `${randomType}-0${randomNumber}`;

            Device.updateMany(
                { name: deviceName },
                {
                    $push: {
                        events: { message: `Thiết bị ${deviceName} vượt ngưỡng an toàn đo!`, create_at: new Date() },
                    },
                },
                (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(`Fake event ${deviceName} is successfully!`);
                    }
                }
            );
        });
    },

    // GET DEVICE DATA
    getDeviceData: async (req, res) => {
        try {
            const houseData = await House.findById(req.admin.houseId).populate({
                path: 'device_types',
                model: 'DeviceType',
                select: { datas: { $slice: -10 } }, // Lay ra 10 data do duoc moi nhat
            });

            const deviceData = houseData.device_types.map((deviceTypeData) => {
                const { _id, type_name, datas, ...other } = deviceTypeData._doc;
                const newDatas = datas.map((data) => {
                    const vnTime = moment.tz(data.create_at, 'Asia/Ho_Chi_Minh').format('HH:mm DD-MM-YYYY');
                    return { ...data._doc, create_at: vnTime };
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

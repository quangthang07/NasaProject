const launches = require('./launch.mongo');
const planets = require('./planets.mongo');
const axios = require('axios');

const DEFAULT_FLIGHTNUMBER = 100;

async function findLaunch(filter) {
    return await launches.findOne(filter);
}
// load launches from SpaceX api
async function loadLaunchesData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });
    if (firstLaunch) {
        console.log('Launches data already loaded');
        return;
    } else {
        await populateData();
    }
    
}
// populate launch collection
async function populateData () {
    const API_URL = 'https://api.spacexdata.com/v4/launches/query';

    console.log('Loading launches data ...');
    const response = await axios.post(API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: "rocket",
                    select: {
                        name:1
                    }
                },
                {
                    path: "payloads",
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('Problem download launches');
        throw new Error('Launch data download failed')
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })
        const launch = {
            flightNumber : launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        };

        console.log(`${launch.flightNumber} ${launch.mission}`);
        await saveLaunch(launch);
    }
}

async function getLatestFlightNumber() {
    const latestLaunch = await launches.findOne().sort('-flightNumber');
    if (!latestLaunch) {
        return DEFAULT_FLIGHTNUMBER;
    }

    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
    // return Array.from(launches.values());
    return await launches.find({}, {'_id': 0,'__v':0})
    .sort({flightNumber: 1}) //-1 giam dan
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
    
    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert: true
    });
}

async function addNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });
    if (!planet) {
        throw new Error('No matching planet found')
    }
    const newFlightNumber = await getLatestFlightNumber() + 1;
    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customer: ['Nasa'],
        flightNumber: newFlightNumber,
    });
    await saveLaunch(newLaunch);
}

async function existLaunchWithID(launchID) {
    return await findLaunch({
        flightNumber: launchID,
    })
}
async function abortLaunchByID(id) {
    const aborted = await launches.updateOne({
        flightNumber: id,
    },{
        upcoming: false,
        success: false,
    });
    return aborted.modifiedCount === 1;
}

module.exports = {
    loadLaunchesData,
    getAllLaunches,
    addNewLaunch,
    existLaunchWithID,
    abortLaunchByID,

};
const {
    getAllLaunches,
    addNewLaunch,
    existLaunchWithID,
    abortLaunchByID,
} = require('../../models/launch.model');

const {getPagination} = require('../../services/query');

async function httpGetAllLaunches(req, res) {
    const {skip, limit} = getPagination(req.query);
    return res.status(200).json(await getAllLaunches(skip, limit));
}

async function httpAddNewLaunch(req, res) {
    const launch = req.body;

    if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
        return res.status(400).json({
            error: 'Missing required launch property'
        });
    }

    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
        return res.status(400).json({
            error: 'Invalid launch date'
        })
    }

    await addNewLaunch(launch);
    res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
    const launchID = Number(req.params.id);

    const existLaunch = await existLaunchWithID(launchID);

    if (!existLaunch) {
        //if launch doesn't exist
        return res.status(404).json({
            error: 'Launch not found.'
        });
    }
    
    const aborted = abortLaunchByID(launchID);
    if (!aborted) {
        return res.status(400).json({
            error: "Launch not aborted"
        })
    }
    return res.status(200).json({
        ok: true
    });
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch,

}
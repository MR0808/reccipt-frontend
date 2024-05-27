import Country from '../models/country.js';
import State from '../models/state.js';

export async function getStates(req, res, next) {
    console.log(req.query.country);
    const states = await State.find({ country: req.query.country });
    return res.status(200).json({ data: states });
}

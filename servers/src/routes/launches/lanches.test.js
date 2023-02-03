const request = require('supertest');
const app = require('../../app');
const {mongoConnect, mongoDisconnect} = require('../../services/mongo');

describe('Launches with mongoDB', () => {
    beforeAll( async () => {
        await mongoConnect();
    });

    describe('Test GET /launches', () => {
        test('It should response with 200 success', async () => {
            const response = await request(app).get('/v1/launches').expect('Content-Type', /json/).expect(200);
            // expect(response.statusCode).toBe(200);
        });
    });
    
    describe('Test POST /launches', () => {
        const completeLaunchData = {
            mission: 'Uss enterprise',
            rocket : 'NCC 1701-QT',
            target: "Kepler-441 b",
            launchDate: "July 13, 2028"
        }
        const launchDataWithoutDate = {
            mission: 'Uss enterprise',
            rocket : 'NCC 1701-QT',
            target: "Kepler-441 b",
        }
        const launchDataWithInvalidDate = {
            mission: 'Uss enterprise',
            rocket : 'NCC 1701-QT',
            target: "Kepler-186",
            launchDate: "invalid date"
        }
    
        test('It should response with 201 success', async () => {
            const response = await request(app).post('/v1/launches').send(completeLaunchData).expect('Content-Type', /json/).expect(201); 
    
            const responseDate = new Date(response.body.launchDate).valueOf();
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);
            expect(response.body).toMatchObject({
                mission: 'Uss enterprise',
                rocket : 'NCC 1701-QT',
                target: "Kepler-441 b",
                
            });
        });
    
        test('It should catch missing required properties', async () => {
            const response = await request(app).post('/v1/launches').send(launchDataWithoutDate).expect('Content-Type', /json/).expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Missing required launch property'
            })
        });
        test('It should catch invalid date', async ()=> {
            const response = await request(app).post('/v1/launches').send(launchDataWithInvalidDate).expect('Content-Type', /json/).expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Invalid launch date'
            })
        });
    });

    afterAll(async () => {
        await mongoDisconnect();
    });

});


import request from "supertest";
require("chai").should();
import { app } from "../app";
import { Event } from "../models/Event";
import bcrypt from "bcrypt";
import { User as UserSchema } from "../models/User";
import { saltRounds } from "../routes/auth";
import jwt from "jsonwebtoken";
const jwtToken = "shhhhhhh";

const baseUrl = "/v1/events";

describe.only("events", () => {

  const event = {
    name: "One Day",
    organization: "Ticketzeta",
    venue: "Fabrik Discoteque",
    date:"01/05/2023",
    tickets:[{
      name:"standard",
      price:10,
      quantity:60
    }]
  };

  const user = {
    name: "Samuele",
    surname: "Cammarata",
    email: "sam@email.com",
    password: "provaprova"
  };

  
  let token: string;
  before(async () => {
    const userCreated = new UserSchema({
      name: user.name,
      surname: user.surname,
      email: user.email,
      password: await bcrypt.hash(user.password, saltRounds),
    });
    await userCreated.save();
    token = jwt.sign(
      {
        id: userCreated._id,
        email: userCreated.email,
        name: userCreated.name,
        surname: userCreated.surname,
      },
      jwtToken
    );
    console.log("token:", token);
  });
  after(async () => {
    await UserSchema.findOneAndDelete({ email: user.email });
  });


  // ----------------- TEST EVENTI ----------------- //

  describe("get events", () => {
    let ids: string[] = [];
    const events = [
      {
        name: "Easter",
        organization: "Dissonanze",
        venue: "Comida",
        date: "02/05/2023",
        tickets:[{
          name:"standard",
          price:10,
          quantity:60
        }]
      },
      {
        name: "Vita Spericolata",
        organization: "Ticketzeta",
        venue: "Odeon",
        date: "08/04/2023",
        tickets:[{
          name:"standard",
          price:10,
          quantity:60
        }]
      },
      {
        name: "Alibi",
        organization: "PT srls",
        venue: "Discoteca",
        date: "06/07/2023",
        tickets:[{
          name:"standard",
          price:10,
          quantity:60
        }]
      },
    ];

    before(async () => {
      await Event.deleteMany({});
      const response = await Promise.all([
        Event.create(events[0]),
        Event.create(events[1]),
        Event.create(events[2]),
      ]);
      ids = response.map((item) => item._id.toString());
    });
    after(async () => {
      await Event.deleteMany({});
      await Promise.all([
        Event.findByIdAndDelete(ids[0]),
        Event.findByIdAndDelete(ids[1]),
        Event.findByIdAndDelete(ids[2]),
      ]);
    });

    it("test success 200", async () => {
      const { status, body } = await request(app).get(baseUrl);
      status.should.be.equal(200);
      body.should.have.property("length").equal(events.length)
    });

    it("test success 200 with query params", async () => {
      const organization = "Dissonanze";
      const { status, body } = await request(app).get(
        `${baseUrl}?organization=${organization}`
      );
      status.should.be.equal(200);
      body.should.have.property("length").equal(1)
    });
  });




  describe("buy event tickets", () => {
    let id: string;
    let qt = 20; //quantità biglietti da acquistare
    let res;

    after(async () => {
      await Event.deleteMany({})
    });
    before(async () => {
       id = (await Event.create(event))._id.toString();
    });

    it("failed test 401", async () => {
      const { status } = (await request(app).post(`${baseUrl}/${id}/tickets`).send({tickets: event.tickets}).set({authorization: "abc"}));
      status.should.be.equal(401);
    });
    it("failed test 400", async () => {
      const { status } = await request(app).post(`${baseUrl}/${id}/tickets`).send([{name:"standard", price: 10, quantity: 200}]).set({ authorization: token });
      status.should.be.equal(400);
    });
    it("failed test 404", async () => {
      const { status } = await request(app).post(`${baseUrl}/abc123/tickets`).send({tickets:event.tickets}).set({ authorization: token });
      status.should.be.equal(404);
    });
    it("success test 201", async () => {
      const { status, body } = await request(app)
        .post(`${baseUrl}/${id}/tickets`)
        .send({tickets:event.tickets})
        .set({ authorization: token });
      status.should.be.equal(201);
      body.should.have.property("event");
      body.should.have.property("Total price");
    });
  });



  describe("create event", () => {
    let id: string;
    after(async () => {
      await Event.deleteMany({})
    });
    it("failed test 401", async () => {
      const { status } = await request(app).post(baseUrl).send(event);
      status.should.be.equal(401);
    });
    it("success test 201", async () => {
      const { status, body } = await request(app)
        .post(baseUrl)
        .send(event)
        .set({ authorization: token });
      status.should.be.equal(201);
      body.should.have.property("_id");
      body.should.have.property("name").equal(event.name);
      body.should.have.property("organization").equal(event.organization);
      body.should.have.property("venue").equal(event.venue);
      body.should.have.property("date").equal(event.date);
      id = body._id;
    });
  });

  describe("update event", () => {
    let id: string;
    const newOrganization = "ZeroEvents";
    before(async () => {
      const e = await Event.create(event);
      id = e._id.toString();
    });
    after(async () => {
      await Event.deleteMany({})
    });
    it("test failed 401", async () => {
      const { status } = await request(app)
        .put(`${baseUrl}/${id}`)
        .send({ ...event, organization: newOrganization });
      status.should.be.equal(401);
    });
    it("test success 200", async () => {
      const { status, body } = await request(app)
        .put(`${baseUrl}/${id}`)
        .send({ ...event, organization: newOrganization })
        .set({ authorization: token });
      status.should.be.equal(200);
      body.should.have.property("_id");
      body.should.have.property("name").equal(event.name);
      body.should.have.property("organization").equal(newOrganization);
      body.should.have.property("venue").equal(event.venue);
      body.should.have.property("date").equal(event.date);
    });

    it("test unsuccess 404 not valid mongoId", async () => {
      const fakeId = "a" + id.substring(1);
      const { status } = await request(app)
        .put(`${baseUrl}/${fakeId}`)
        .send({ ...event, organization: newOrganization })
        .set({ authorization: token });
      status.should.be.equal(404);
    });

    it("test unsuccess 400 missing organization", async () => {
      const fakeEvent = { ...event } as any;
      delete fakeEvent.organization;
      const { status } = await request(app)
        .put(`${baseUrl}/${id}`)
        .send(fakeEvent)
        .set({ authorization: token });
      status.should.be.equal(400);
    });

    it("test unsuccess 400 date not a date", async () => {
      const fakeEvent = { ...event } as any;
      fakeEvent.date = "notADate";
      const { status } = await request(app)
        .put(`${baseUrl}/${id}`)
        .send(fakeEvent)
        .set({ authorization: token });
      status.should.be.equal(400);
    });
  });

  describe("delete event", () => {
    let id: string;
    before(async () => {
      const e = await Event.create(event);
      id = e._id.toString();
    });
    it("test failed 401", async () => {
      const { status } = await request(app).delete(`${baseUrl}/${id}`);
      status.should.be.equal(401);
    });
    it("test success 200", async () => {
      const { status } = await request(app)
        .delete(`${baseUrl}/${id}`)
        .set({ authorization: token });
      status.should.be.equal(200);
    });
  });

  describe("get event tickets", () => {
    let id: string;
    before(async () => {
      const e = await Event.create(event);
      id = e._id.toString();
    });
    after(async () => {
      await Event.deleteMany({})
    });

    it("test unsuccess 404", async () =>{
      const { status, body } = await request(app).get(`${baseUrl}/wrongId/tickets`);
      status.should.be.equal(404);
    })

    it("test success 200", async () => {
      const { status, body } = await request(app).get(`${baseUrl}/${id}/tickets`);
      status.should.be.equal(200);
      body.should.have.property("_id").equal(id);
      body.should.have.property("name").equal(event.name);
      body.should.have.property("tickets");
    });
  });
});

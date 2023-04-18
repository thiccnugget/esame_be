import express, { Request, Response, NextFunction } from "express";
import { body, header, param, query } from "express-validator";
import { checkErrors } from "./utils";
import { Event } from "../models/Event";
import { isAuth } from "./auth";
var moment = require('moment');
moment().format(); 
const router = express.Router();

export const checkDate = async (req: Request, res: Response, next: NextFunction) => {
  const date = new Date(moment(new Date(req.body.date)).format("DD/MM/YYYY"));
  if (moment(date).isValid()) {
    req.body.date = moment(date).format("DD/MM/YYYY").toString();
    //console.log(req.body.date);
    return next();
  } else {
    return res.status(400).json({ message: "Invalid date format. Try dd/mm/YYYY" });
  }
}

// ---------- POST ---------- //

//ACQUISTO
router.post("/:id/tickets", 
  param("id").isMongoId(),
  body("tickets").isArray(),
  body("tickets").contains({"name":String, "quantity":Number}),
  checkErrors, 
  async (req, res) => {
  const { id } = req.params;
  
  const event = await Event.findById(id);

  if (event == null) {
    return res.status(404).json({ message: "Event not found" });
  } else if(event.tickets.some((t)=>t.quantity! < Math.min(req.body.tickets.map((element : any) =>element.quantity )) || t.quantity === 0)){
    return res.status(404).json({ message: "Not enough tickets", "available": event.tickets});
  } else { 
      let tot = 0;
      req.body.tickets.map((element : any) => {
          const index = event.tickets.findIndex((el)=>el.name===element.name);
          event.tickets[index].quantity! -= element.quantity;
          tot += element.quantity * element.price;
      });
      event.save();
      return res.status(200).json({event,"Total price": `${tot}€`});
  }
});



// CREAZIONE
router.post(
  "/",
  header("authorization").isJWT(),
  body("name").exists().isString(),
  body("organization").exists().isString(),
  body("venue").exists().isString(),
  body("date").exists(), checkDate,
  body("tickets").contains([{"name":String, "price":Number, "quantity":Number}]),
  checkErrors,
  isAuth,
  async (req, res) => {
    const { name, organization, venue, date, tickets } = req.body;
    const event = new Event({ name, organization, venue, date, tickets });
    const eventSaved = await event.save();
    res.status(201).json(eventSaved);
  }
);

// ---------- PUT ---------- //
router.put(
  "/:id",
  header("authorization").isJWT(),
  param("id").isMongoId(),
  body("name").exists().isString(),
  body("organization").exists().isString(),
  body("date").exists(), checkDate,
  body("tickets").contains([{"name":String, "price":Number, "quantity":Number}]),
  checkErrors,
  isAuth,
  async (req, res) => {
    const { id } = req.params;
    const { name, organization, venue, date, tickets } = req.body;
    try {
      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({ message: "event not found" });
      }
      event.name = name;
      event.organization = organization;
      event.venue = venue;
      event.date = date;
      event.tickets = tickets;
      const eventSaved = await event.save();
      res.json(eventSaved);
    } catch (err) {
      res.status(500).json({ err });
    }
  }
);

// ---------- DELETE ---------- //

router.delete(
  "/:id",
  header("authorization").isJWT(),
  param("id").isMongoId(),
  checkErrors,
  isAuth,
  async (req, res) => {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    await Event.findByIdAndDelete(id);
    res.json({ message: "Event deleted" });
  }
);

// ---------- GET ---------- //

//CON ID
router.get("/:id", 
  param("id").isMongoId(),
  checkErrors, 
  async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }
  res.json(event);
});

//CON ID - SOLO TICKETS E NOME
router.get("/:id/tickets", 
  param("id").isMongoId(),
  checkErrors, 
  async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id).select(["name","tickets"]);
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }
  res.json(event);
});

// TUTTI GLI EVENTI
router.get(
  "/",
  query("name").optional().isString(),
  query("organization").optional().isString(),
  query("venue").optional().isString(),
  query("date").optional(),
  checkErrors,
  async (req, res) => {
    const events = await Event.find({ ...req.query });
    res.json(events);
  }
);

export default router;

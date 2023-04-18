Cammarata Samuele

Risorsa: evento

endpoint:

GET (events) + query params     OK <br>
GET (events/:id)                OK <br>
GET (events/:id/tickets)        OK - solo tickets + nome evento <br>
POST (events/:id/tickets)       OK - NO TEST <br>
PUT (events/:id)                OK <br>
DELETE (events/id)              OK <br>


le date sono gestite in routes/events.ts -> checkDate
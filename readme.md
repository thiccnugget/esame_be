Cammarata Samuele

Risorsa: evento

endpoint a fine esame 5 ore:

1) GET (events) + query params     OK <br>
2) GET (events/:id)                OK <br>
3) GET (events/:id/tickets)        OK - solo tickets + nome evento <br>
4) POST (events/:id/tickets)       OK - test aggiunto (21/04/2023) <br>
5) PUT (events/:id)                OK <br>
6) DELETE (events/id)              OK <br>


le date sono gestite in routes/events.ts -> checkDate <br>
/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */
class Customer {
  constructor({ id, first_name, last_name, phone, notes }) {
    this.id = id;
    this.firstName = first_name;
    this.lastName = last_name;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */
  // We have removed the AS aliases because it affected the results at the customer class

  static async all() {
    const results = await db.query(
      `SELECT id,
         first_name,
         last_name,
         phone,
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
         first_name,
         last_name,
         phone,
         notes
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }


  static async getTopTen() {
    const results = await db.query(
      `SELECT c.id, first_name , last_name,
      phone, c.notes,
      COUNT(first_name) as numOfReservations
      FROM customers AS c LEFT JOIN reservations AS r ON c.id = r.customer_id
       GROUP BY c.id, first_name, last_name, phone, c.notes
       ORDER BY numOfReservations DESC LIMIT 10`
    );

    // let newRows = results.rows.map(row => delete row["numofreservations"]);
    // console.log("******* RESULTS*********", results.rows);
    let finalResult =  results.rows.map(c => new Customer(c));
    console.log("*********final result**********", finalResult);
    return finalResult;
  }

  /** get full name for this customer. */
  /** do not need async because not querying the db. */
  getFullName() {
    const fullName = `${this.firstName} ${this.lastName}`;
    return fullName;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }


  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;

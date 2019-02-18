const pg = require('pg')
// const fs = require('fs')

const pool = new pg.Pool({
  database: 'hackathon',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  user: 'admin'
})

pool.connect(err => {
  if (err) console.log(err)
  else {
    console.log('[pg] connected')
  }
})

module.exports = {
  getUserByUsername: username => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT * FROM "user" WHERE username='${username}';`,
        (err, res) => {
          if (err) reject('ERROR: 06')
          else resolve({ ...res.rows[0] })
        }
      )
    })
  },

  getUserByID: id => {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM "user" WHERE id=${id};`, (err, res) => {
        // if (err) reject('ERROR: 05')
        if (err) resolve({})
        else resolve({ ...res.rows[0] })
      })
    })
  },

  getScore: id => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT sum(score) FROM "submission" WHERE "playerID"=${id};`,
        (err, res) => {
          if (err) console.log(err)
          resolve(0)
        }
      )
    })
  },

  getChallenges: id => {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT * FROM "challenge" LEFT JOIN (SELECT score, "challengeID" FROM "submission" WHERE "playerID"=1) AS submissions ON challenge.id =  submissions."challengeID";`,
        (err, res) => {
          console.log(res.rows)
          if (err) {
            reject('ERROR: 04')
          } else {
            const challenges = res.rows.map(challenge => ({
              number: challenge.id,
              name: challenge.name,
              description: challenge.description,
              points: challenge.points,
              score: +challenge.score
            }))
            resolve(challenges)
          }
        }
      )
    })
  },

  getChallenge: id => {
    return new Promise((resolve, reject) => {
      console.log('id' + ' <=> ' + id)
      pool.query(`SELECT * FROM "challenge" WHERE id=${id}`, (err, res) => {
        console.log('challenge' + ' <=> ' + res)
        if (err) reject('ERROR: 03')
        else if (res.rows[0]) {
          resolve(res.rows[0])
        } else {
          resolve({})
        }
      })
    })
  },

  addChallenge: data => {
    return new Promise((resolve, reject) => {
      const name = data.challenge.name
      const description = data.challenge.description
      const method_name = data.method.name
      const method_type = data.method.type
      const tests = JSON.stringify(data.tests)
      const parameters = JSON.stringify(data.params)
      const points = data.challenge.score
      pool.query(
        `INSERT INTO "challenge" (name, description, method_name, method_type, tests, parameters, points) VALUES ('${name}', '${description}', '${method_name}', '${method_type}', '${tests}', '${parameters}', ${points})`,
        (err, res) => {
          if (err) reject('ERROR: 01')
          else resolve(res.insertId)
        }
      )
    })
  },

  addSubmission: ({ id, number, code, score }) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `UPDATE "submission" SET score=${score} WHERE playerID=${id} and challengeID=${number}`,
        (err, res) => {
          if (err) {
            reject()
          } else if (res.affectedRows === 0) {
            pool.query(
              `INSERT INTO "submission" (playerID, challengeID, code, score) VALUES (${id}, ${number}, '${code}', ${score})`,
              (err, res) => {
                if (err) reject('ERROR: 02')
                else resolve()
              }
            )
          } else {
            resolve()
          }
        }
      )
    })
  }
  // INSERT INTO submissions (playerID, challengeNumber, code, score) VALUES (${playerID}, ${challengeNumber}, '${code}', ${score})
}

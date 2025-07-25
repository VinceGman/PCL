const axios = require('axios');
const { parse } = require('csv-parse/sync');

module.exports = {
  async getCSVCards() {
    const res = await axios.get(process.env.GOOGLE_SHEETS_CARDS_CSV);
    const records = parse(res.data, {
      columns: true, // first row as headers
      skip_empty_lines: true
    });
    return records;
  }
}

// fs.createReadStream("https://docs.google.com/spreadsheets/d/e/2PACX-1vSMCI7J_Si1Su88MRcDi35BuBuzYky3hiVaimiQ6RJbMSR3kxtOt33wY-fBaRfziKjKSQShLz-JOznw/pub?gid=240707961&single=true&output=csv")
//     .pipe(csv())
//     .on('data', (data) => {

//         //         // if (data.name !== 'Contingency') return;

//         //         // "name","level","casting_time","duration","school","range","components","text","amplify"
//         //         const folderName = data.school;
//         //         const folderPath = path.join('./War/Spells', folderName);

//         //         if (!fs.existsSync(folderPath)) {
//         //             fs.mkdirSync(folderPath, { recursive: true });
//         //         }

//         //         const fileName = `${data.name.replace(/[\/:*?"<>|\\]/g, '_')}.md`;
//         //         const filePath = path.join(folderPath, fileName);

//         //         const spell_explanation_sections = data.text.split(/(?<=\.)(?=\S)/);
//         //         const spell_explanation_text = spell_explanation_sections.join('\n\n---\n\n');

//         //         const formatted_spell_text = `---
//         // tags:
//         // - ${data.school}
//         // Casting Time: ${data.casting_time}
//         // Range: ${data.range}
//         // Components: ${data.components}
//         // Duration: ${data.duration}
//         // ---
//         // #### [[${data.name}]]

//         // _${data.school}_

//         // ---

//         // - **Casting Time:** ${data.casting_time}
//         // - **Range:** ${data.range}
//         // - **Components:** ${data.components}
//         // - **Duration:** ${data.duration}

//         // ---

//         // ${spell_explanation_text}

//         // ---

//         // Level: ${data.level}
//         // Amplify: ${data.amplify}`;

//         //         fs.writeFileSync(filePath, formatted_spell_text);
//         //         console.log(`File written: ${filePath}`);
//     })
//     .on('end', () => {
//         console.log('CSV processing complete.');
//     });


// /*

// ---
// tags:
// - Evocation
// Casting Time: 10 minutes
// Range: Self
// Components: V, S
// Duration: 48 hours
// ---
// #### [[Contingency]]

// _Evocation_

// ---

// - **Casting Time:** 10 minutes
// - **Range:** Self
// - **Components:** V, S
// - **Duration:** 48 hours

// ---

// Choose a spell that you can cast that can target you. You cast that spell--called the contingent spell--as part of casting contingency, expending spell slots for both, but the contingent spell doesn't come into effect. Instead, it takes effect when a certain circumstance occurs. You describe that circumstance when you cast the two spells. For example, a contingency cast with Distortion Field might stipulate that Distortion Field only comes into effect when you are going to be hit with an attack.

// ---

// The contingent spell takes effect immediately after the circumstance is met for the first time, whether or not you want it to, and then contingency ends. You can use only one contingency spell at a time.

// ---

// If you cast this spell again, the effect of another contingency spell on you ends.

// */
// DATA DEFINITION

const playData = {
    scenes: [
        {
            id: 'prologue',
            name: 'Prologue',
            start: 173,
            end: 465,
            lineStart: 1,
            lineEnd: 99,
            characters: ['antigone', 'ismene'],
            emotions: ['anxiety', 'fear', 'courage', 'defiance', 'grief'],
            themes: ['divine-law', 'family-duty', 'burial-rites', 'honor-dead', 'moral-conscience'],
            events: ['creon-decree', 'public-stoning-punishment'],
            text: {
                ancient: 'Ὦ κοινὸν αὐτάδελφον Ἰσμήνης κάρα, ἆρ᾽ οἶσθ᾽ ὅ τι Ζεὺς τῶν ἀπ᾽ Οἰδίπου κακῶν...',
                modern: 'Ω κοινή αδελφή μου Ισμήνη, ξέρεις τίποτα από όσα κακά που μας έστειλε ο Δίας...',
                english: 'O common sister of my own blood, Ismene, do you know of any suffering from Oedipus...'
            }
        },
        {
            id: 'parodos',
            name: 'Parodos',
            start: 480,
            end: 705,
            lineStart: 100,
            lineEnd: 161,
            characters: ['chorus', 'antigone', 'ismene'],
            emotions: ['pride', 'defiance', 'awe'],
            themes: ['divine-help', 'war-aftermath', 'thebes-defense', 'noble-death', 'authority'],
            events: ['victory-at-thebes', 'creon-becomes-ruler'],
            text: {
                ancient: 'Ἀκτὶς ἁλίου, τὸ κάλλιστον φάνεισαν...',
                modern: 'Ακτίνα του ηλίου, η πιο όμορφη που έλαμψε...',
                english: 'Ray of the sun, the most beautiful that has shone...'
            }
        },
        {
            id: 'episode1',
            name: 'Episode 01',
            start: 720,
            end: 1350,
            lineStart: 162,
            lineEnd: 331,
            characters: ['creon', 'chorus', 'guard'],
            emotions: ['anger', 'defiance', 'fear', 'pride'],
            themes: ['authority', 'burial-edict', 'human-law', 'patriotism', 'corruption-by-money'],
            events: ['creon-proclaims-decree', 'brothers-death', 'first-burial'],
            text: {
                ancient: 'Οὐ γὰρ τί μοι Ζεὺς ἦν ὁ κηρύξας τάδε...',
                modern: 'Διότι δεν ήταν ο Δίας εκείνος που μου το διέταξε...',
                english: 'For it was not Zeus who made this proclamation to me...'
            }
        },
        {
            id: 'stasimon1',
            name: 'Stasimon 01',
            start: 1420,
            end: 1555,
            lineStart: 332,
            lineEnd: 383,
            characters: ['chorus'],
            emotions: ['awe', 'foreboding'],
            themes: ['human-power-and-limits', 'law-and-city', 'foreshadowing-antigone'],
            events: [],
            text: {
                ancient: 'Πολλὰ τὰ δεινὰ κοὐδὲν ἀνθρώπου δεινότερον πέλει...',
                modern: 'Πολλά τα τρομερά, αλλά τίποτα πιο τρομερό από τον άνθρωπο...',
                english: 'Many are the wonders, but nothing is more wonderful than man...'
            }
        },
        {
            id: 'episode2',
            name: 'Episode 02',
            start: 1560,
            end: 2230,
            lineStart: 384,
            lineEnd: 581,
            characters: ['creon', 'chorus', 'antigone', 'ismene', 'guard'],
            emotions: ['anger', 'defiance', 'grief', 'courage', 'remorse'],
            themes: ['divine-law', 'authority', 'burial-rites', 'family-duty', 'death-penalty'],
            events: ['antigone-arrested', 'confrontation', 'ismene-tries-to-share-blame'],
            text: {
                ancient: 'Ἀλλ᾽ οὔτι τοι κράτος ὃς ἂν εἰς πλοῦτον πέσῃ...',
                modern: 'Αλλά καμία εξουσία δεν μπορεί να σώσει αυτόν που πέφτει στο πλούτο...',
                english: 'But no power can save him who falls into wealth...'
            }
        },
        {
            id: 'stasimon2',
            name: 'Stasimon 02',
            start: 2231,
            end: 2380,
            lineStart: 582,
            lineEnd: 630,
            characters: ['chorus'],
            emotions: ['awe', 'grief', 'foreboding'],
            themes: ['divine-omnipotence', 'generational-curse', 'human-frailty', 'inevitable-ruin'],
            events: ['divine-intervention', 'generational-ruin'],
            text: {
                ancient: 'Μακάρων δὲ καὶ τυχόντι φρενὸς ἀσκαθής...',
                modern: 'Μακάριος όποιος δεν γνώρισε κακό...',
                english: 'Blessed is he who has not tasted evil...'
            }
        },
        {
            id: 'episode3',
            name: 'Episode 03',
            start: 2381,
            end: 2728,
            lineStart: 631,
            lineEnd: 780,
            characters: ['creon', 'chorus', 'haemon'],
            emotions: ['anger', 'defiance', 'pride', 'grief'],
            themes: ['authority', 'age-vs-youth', 'tyranny', 'filial-piety', 'divine-law'],
            events: ['father-son-quarrel', 'haemon-storms-out', 'antigone-condemned'],
            text: {
                ancient: 'Ἀλλ᾽ εὖ διδάχθητ᾽, ἄνδρες, οἱ φρονεῖν λέγοντες...',
                modern: 'Αλλά μάθετε καλά, άνδρες που λέτε ότι σκέφτεστε...',
                english: 'But be well taught, men who claim to think...'
            }
        },
        {
            id: 'stasimon3',
            name: 'Stasimon 03',
            start: 2730,
            end: 2867,
            lineStart: 781,
            lineEnd: 805,
            characters: ['chorus'],
            emotions: ['awe', 'foreboding', 'lament'],
            themes: ['eros-overpowers-reason', 'death-and-hades', 'civic-purity'],
            events: [],
            text: {
                ancient: 'Ἔρως ἀνίκατε μάχαν...',
                modern: 'Έρωτα ανίκητε στη μάχη...',
                english: 'Love, unconquered in battle...'
            }
        },
        {
            id: 'episode4',
            name: 'Episode 04',
            start: 2868,
            end: 3210,
            lineStart: 806,
            lineEnd: 943,
            characters: ['antigone', 'chorus', 'creon'],
            emotions: ['grief', 'lament', 'loneliness', 'foreboding'],
            themes: ['death-as-marriage', 'family-curse', 'isolation-and-death', 'piety-and-suffering'],
            events: ['antigone-led-to-tomb'],
            text: {
                ancient: 'Ὁρᾶτ᾽ ἔμ᾽, ὦ γᾶς πατρίας πολῖται...',
                modern: 'Δείτε με, πολίτες της πατρικής μου γης...',
                english: 'Look at me, citizens of my fatherland...'
            }
        },
        {
            id: 'stasimon4',
            name: 'Stasimon 04',
            start: 3216,
            end: 3296,
            lineStart: 944,
            lineEnd: 987,
            characters: ['chorus'],
            emotions: ['lament', 'foreboding', 'grief'],
            themes: ['fate-inevitability', 'noble-suffering', 'divine-power-over-human-will'],
            events: [],
            text: {
                ancient: 'Καὶ τὰ Δαναᾶς φῶς...',
                modern: 'Και της Δανάης το φως...',
                english: 'And the light of Danae...'
            }
        },
        {
            id: 'episode5',
            name: 'Episode 05',
            start: 3302,
            end: 3798,
            lineStart: 988,
            lineEnd: 1114,
            characters: ['creon', 'teiresias', 'chorus'],
            emotions: ['anger', 'fear', 'remorse', 'foreboding'],
            themes: ['hybris', 'divine-retribution', 'prophecy', 'state-vs-prophecy', 'wisdom-vs-folly'],
            events: ['teiresias-warning', 'peripeteia', 'creon-relents'],
            text: {
                ancient: 'Ἄναξ, φράσω σοι...',
                modern: 'Άναξ, θα σου πω...',
                english: 'Lord, I will tell you...'
            }
        },
        {
            id: 'hyporchema',
            name: 'Hyporchema',
            start: 3804,
            end: 3886,
            lineStart: 1115,
            lineEnd: 1152,
            characters: ['chorus'],
            emotions: ['hope', 'urgency', 'awe'],
            themes: ['dionysian-worship', 'civic-cleansing', 'divine-help', 'purification'],
            events: ['invocation-of-dionysus'],
            text: {
                ancient: 'Ἴθι, Βάκχε...',
                modern: 'Έλα, Βάκχε...',
                english: 'Come, Bacchus...'
            }
        },
        {
            id: 'exodos',
            name: 'Exodos',
            start: 3888,
            end: 4897,
            lineStart: 1183,
            lineEnd: 1353,
            characters: ['creon', 'chorus', 'messenger', 'eurydice'],
            emotions: ['grief', 'lament', 'remorse', 'foreboding', 'anxiety'],
            themes: ['divine-retribution', 'late-wisdom', 'human-folly', 'fate-instability', 'annihilation'],
            events: ['haemon-death', 'antigone-death', 'eurydice-death', 'creon-collapse'],
            text: {
                ancient: 'Ἰὼ ἰώ, δύσφρονες ἁμαρτίαι...',
                modern: 'Αχ, τα φρικτά λάθη της σκέψης μου...',
                english: 'Alas, the dreadful errors of my thought...'
            }
        }
    ],


    characters: [
        { id: 'antigone',  name: 'Antigone',  importance: 35, color: '#c05640' },
        { id: 'creon',     name: 'Creon',     importance: 32, color: '#0e4d92' },
        { id: 'chorus',    name: 'Chorus',    importance: 28, color: '#b8860b' },
        { id: 'ismene',    name: 'Ismene',    importance: 15, color: '#556b2f' },
        { id: 'haemon',    name: 'Haemon',    importance: 12, color: '#66023c' },
        { id: 'teiresias', name: 'Teiresias', importance: 10, color: '#4b3621' },
        { id: 'guard',     name: 'Guard',     importance:  8, color: '#6b5b3c' },
        { id: 'messenger', name: 'Herald', importance:  7, color: '#5a4a2a' },
        { id: 'eurydice',  name: 'Eurydice',  importance:  5, color: '#7a3a5a' }
    ]
};


const sceneCounts = {};


playData.scenes.forEach(scene => {
    scene.characters.forEach(charId => {
        sceneCounts[charId] = (sceneCounts[charId] || 0) + 1;
    });
});


const maxScenes = Math.max(...Object.values(sceneCounts));


const MAX_BUBBLE_SIZE = 35;
const MIN_BUBBLE_SIZE = 8;


playData.characters = playData.characters.map(char => {
    const count = sceneCounts[char.id] || 0;


    let dynamicImportance = Math.round((count / maxScenes) * MAX_BUBBLE_SIZE);


    dynamicImportance = Math.max(MIN_BUBBLE_SIZE, dynamicImportance);

    return {
        ...char,
        importance: dynamicImportance
    };
});


playData.characters.sort((a, b) => b.importance - a.importance);


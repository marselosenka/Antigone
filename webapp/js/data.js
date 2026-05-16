 
// DATA DEFINITION

const playData = {
    scenes: [
        {
            id: 'prologue',
            name: 'Prologue',
            start: 173,
            end: 465,
            characters: ['antigone', 'ismene'],
            emotions: ['anxiety', 'fear', 'courage'],
            themes: ['divine-law', 'family-duty', 'moral-conscience'],
            events: ['creon-decree'],
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
            characters: ['chorus'],
            emotions: ['pride'],
            themes: ['authority', 'justice'],
            events: [],
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
            characters: ['creon', 'chorus'],
            emotions: ['anger', 'defiance', 'courage'],
            themes: ['human-law', 'authority', 'divine-law'],
            events: ['creon-decree', 'burial', 'arrest'],
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
            characters: ['chorus'],
            emotions: ['grief'],
            themes: ['justice', 'moral-conscience'],
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
            characters: ['creon', 'chorus', 'antigone', 'ismene'],
            emotions: ['anger', 'grief', 'remorse'],
            themes: ['authority', 'family-duty', 'liberty'],
            events: ['confrontation', 'punishment'],
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
            characters: ['chorus'],
            emotions: ['grief', 'fear'],
            themes: ['divine-law', 'justice'],
            events: [],
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
            characters: ['creon', 'chorus', 'haemon'],
            emotions: ['fear', 'remorse', 'grief'],
            themes: ['divine-law', 'authority', 'self-sacrifice'],
            events: ['prophecy', 'deaths'],
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
            characters: ['chorus'],
            emotions: ['awe', 'fear'],
            themes: ['divine-law', 'fate', 'justice'],
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
            characters: ['antigone', 'chorus', 'creon'],
            emotions: ['grief', 'courage', 'loneliness'],
            themes: ['family-duty', 'divine-law', 'self-sacrifice'],
            events: ['punishment'],
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
            characters: ['chorus'],
            emotions: ['lament', 'foreboding'],
            themes: ['fate', 'suffering', 'justice'],
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
            characters: ['creon', 'teiresias', 'chorus'],
            emotions: ['anger', 'fear', 'remorse'],
            themes: ['authority', 'divine-law', 'prophecy'],
            events: ['prophecy', 'reversal'],
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
            characters: ['chorus'],
            emotions: ['hope', 'urgency'],
            themes: ['prayer', 'divine-help'],
            events: ['invocation'],
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
            characters: ['creon', 'chorus', 'teiresias'],
            emotions: ['grief', 'remorse'],
            themes: ['justice', 'self-sacrifice'],
            events: ['deaths'],
            text: {
                ancient: 'Ἰὼ ἰώ, δύσφρονες ἁμαρτίαι...',
                modern: 'Αχ, τα φρικτά λάθη της σκέψης μου...',
                english: 'Alas, the dreadful errors of my thought...'
            }
        }
    ],

    characters: [
        { id: 'antigone',  name: 'Antigone',  importance: 35, color: '#c05640' },
        { id: 'creon',     name: 'Creon',     importance: 30, color: '#0e4d92' },
        { id: 'ismene',    name: 'Ismene',    importance: 15, color: '#556b2f' },
        { id: 'haemon',    name: 'Haemon',    importance: 12, color: '#66023c' },
        { id: 'chorus',    name: 'Chorus',    importance: 20, color: '#b8860b' },
        { id: 'teiresias', name: 'Teiresias', importance:  8, color: '#4b3621' }
    ]
};

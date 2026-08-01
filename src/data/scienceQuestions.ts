export interface Question {
  id: string;
  subject: 'Science' | 'Mathematics';
  chapter: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  target_year: string;
}

export const scienceQuestions: Question[] = [
  // Chemical Reactions and Equations
  {
    id: "sci-ch1-q1",
    subject: "Science",
    chapter: "Chemical Reactions and Equations",
    question_text: "Solid calcium oxide was taken in a container and water was added slowly to it. (a) Write the observations. (b) Write the chemical formula of the product formed.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Observations: Calcium oxide reacts vigorously with water to form slaked lime. The container becomes hot because a large amount of heat is released. Formula: The product formed is slaked lime, Ca(OH)2.",
    target_year: "CBSE 2013, 2019"
  },
  {
    id: "sci-ch1-q2",
    subject: "Science",
    chapter: "Chemical Reactions and Equations",
    question_text: "What change in color is observed when white silver chloride is left exposed to sunlight? State the type of chemical reaction in this change.",
    options: [],
    correct_answer: "Subjective",
    explanation: "When white silver chloride is exposed to sunlight, it produces black/grey metallic coloured silver along with the liberation of chlorine gas. Equation: 2AgCl -> 2Ag + Cl2. It is a photodecomposition reaction.",
    target_year: "CBSE 2014, 2019, 2023"
  },
  {
    id: "sci-ch1-q3",
    subject: "Science",
    chapter: "Chemical Reactions and Equations",
    question_text: "Write the chemical equation of the reaction in which the following changes take place with an example of each. (a) Change in color (b) Change in temperature",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) Change in color: Reaction between lead nitrate and potassium iodide. Pb(NO3)2(aq) + 2KI -> PbI2(s) + 2KNO3(aq). Colour changes from colourless to yellow. (b) Change in temperature: Action of dilute sulphuric acid on zinc. Zn(s) + H2SO4(aq) -> ZnSO4(s) + H2(g). Heat is evolved.",
    target_year: "CBSE 2015, 2023"
  },
  {
    id: "sci-ch1-q4",
    subject: "Science",
    chapter: "Chemical Reactions and Equations",
    question_text: "In the electrolysis of water, A. Name of the gases liberated at anode & cathode. B. Why is it that the volume of gas collected on one electrode is two times that on the other electrode? C. What would happen if dilute H2SO4 is not added to water?",
    options: [],
    correct_answer: "Subjective",
    explanation: "A. Cathode: H2, Anode: O2. B. At cathode, H+ ion takes two electrons to convert to H2 gas (2 moles H+ gives 1 mole H2). At anode, OH- ion releases two electrons to convert into water and O2 (2 moles OH- gives 0.5 mole O2). Therefore, hydrogen volume is double oxygen. C. Acid is added to make the water conduct electricity as distilled water is a non-conductor.",
    target_year: "CBSE 2013, SP-2018, 2020"
  },
  {
    id: "sci-ch1-q5",
    subject: "Science",
    chapter: "Chemical Reactions and Equations",
    question_text: "A shining metal 'M' on burning gives a dazzling white flame & changes to a white powder 'N'. A. Identify 'M' & 'N'. B. Represent the above reaction in the form of a balanced chemical equation. C. Does 'M' undergo oxidation or reduction in this reaction? Justify.",
    options: [],
    correct_answer: "Subjective",
    explanation: "A. Metal M is Magnesium (Mg). Powder N is Magnesium oxide (MgO). B. 2Mg + O2 -> 2MgO. C. Oxidation. Mg loses two electrons to become stable, changing its oxidation state from 0 to +2.",
    target_year: "CBSE 2020, 2022"
  },

  // Acids, Bases and Salts
  {
    id: "sci-ch2-q1",
    subject: "Science",
    chapter: "Acids, Bases and Salts",
    question_text: "List the important products of the chlor-alkali process. Write one important use of each.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Sodium hydroxide - Used in the manufacturing of paper. Chlorine - Used to make plastics (PVC), CFCs, chloroform. Hydrogen - Used in the hydrogenation of oils to obtain vegetable ghee.",
    target_year: "CBSE 2020, 2023"
  },
  {
    id: "sci-ch2-q2",
    subject: "Science",
    chapter: "Acids, Bases and Salts",
    question_text: "(a) Identify the acid and the base whose combination forms the common salt that you use in your food. Write its chemical formula and chemical name of the salt. (b) What is rock salt? (c) Mention its color and the reason due to which it has this colour.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) HCl (acid) and NaOH (base). Formula is NaCl (Sodium chloride). (b) Deposits of solid salt which are large crystals and brown due to impurities is called rock salt. (c) Brown color is due to impurities. When removed, it turns into white crystals.",
    target_year: "CBSE 2013, 2019"
  },
  {
    id: "sci-ch2-q3",
    subject: "Science",
    chapter: "Acids, Bases and Salts",
    question_text: "Write the chemical equations when zinc granules react with: (a) Sulphuric acid (b) Hydrochloric acid",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) Zn(s) + H2SO4(aq) -> ZnSO4(aq) + H2(g). (b) Zn(s) + 2HCl(aq) -> ZnCl2(aq) + H2(g).",
    target_year: "CBSE 2014, 2020"
  },
  {
    id: "sci-ch2-q4",
    subject: "Science",
    chapter: "Acids, Bases and Salts",
    question_text: "How is sodium hydroxide produced? Write the balanced chemical equation also. Why is this process called the chlor-alkali process? In this process name the products given off at: (a) anode (b) cathode.",
    options: [],
    correct_answer: "Subjective",
    explanation: "When electricity passes through an aqueous solution of NaCl, it decomposes to form NaOH. Called chlor-alkali because of two products: chlor for Chlorine and alkali for Sodium hydroxide. Equation: 2NaCl(aq) + 2H2O(l) -> 2NaOH(aq) + Cl2(g) + H2(g). (a) Anode: Cl2 Gas (b) Cathode: H2 Gas.",
    target_year: "CBSE 2015, 2022"
  },
  {
    id: "sci-ch2-q5",
    subject: "Science",
    chapter: "Acids, Bases and Salts",
    question_text: "Give the reasons for the following: (i) Only one half of water molecule is shown in the formula of plaster of Paris.",
    options: [],
    correct_answer: "Subjective",
    explanation: "The formula means that two molecules (or two formula units) of CaSO4 share one molecule of water so that the effective water of crystallization for one CaSO4 unit comes to half a molecule of water.",
    target_year: "CBSE SP-2017, 2020"
  },

  // Metals and Non-Metals
  {
    id: "sci-ch3-q1",
    subject: "Science",
    chapter: "Metals and Non-Metals",
    question_text: "Why do ionic compounds conduct electricity in molten state and not in solid state?",
    options: [],
    correct_answer: "Subjective",
    explanation: "Ionic compounds do not conduct electricity in solid state because ions are not free to move. In molten state, ions are free to move.",
    target_year: "CBSE 2014, 2023"
  },
  {
    id: "sci-ch3-q2",
    subject: "Science",
    chapter: "Metals and Non-Metals",
    question_text: "The reaction of metal X with Fe2O3 is highly exothermic and is used to join railway tracks. Identify metal X. Write the chemical equation for the reaction.",
    options: [],
    correct_answer: "Subjective",
    explanation: "X is Aluminium. Equation: 2Al + Fe2O3 -> Al2O3 + 2Fe.",
    target_year: "CBSE 2016, 2023"
  },
  {
    id: "sci-ch3-q3",
    subject: "Science",
    chapter: "Metals and Non-Metals",
    question_text: "Zinc is a metal found in the middle of the activity series of metals. In nature, it is found as a carbonate ore, ZnCO3. Mention the steps carried out for extraction from the ore.",
    options: [],
    correct_answer: "Subjective",
    explanation: "1. Calcination: Heating the carbonate ore strongly in limited air to form metal oxide. ZnCO3 + Heat -> ZnO + CO2. 2. Reduction: ZnO is reduced using a reducing agent like carbon. ZnO + C -> Zn + CO.",
    target_year: "CBSE 2013, 2023"
  },
  {
    id: "sci-ch3-q4",
    subject: "Science",
    chapter: "Metals and Non-Metals",
    question_text: "Differentiate between roasting and calcination giving chemical equations for each.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Roasting: Ore is heated in excess of air. Used for sulphide ores. SO2 is produced. (e.g., 2ZnS + 3O2 -> 2ZnO + 2SO2). Calcination: Ore is heated in the absence or limited supply of air. Used for carbonate ores. CO2 is produced. (e.g., ZnCO3 -> ZnO + CO2).",
    target_year: "CBSE 2013, 2023"
  },
  {
    id: "sci-ch3-q5",
    subject: "Science",
    chapter: "Metals and Non-Metals",
    question_text: "Why are copper vessels corroded with a green coating in the rainy season?",
    options: [],
    correct_answer: "Subjective",
    explanation: "Copper reacts with moist carbon dioxide in the air to form a green coating of basic copper carbonate. (Note: Solder mentioned in the source solution seems misplaced for this question, referencing basic corrosion concepts).",
    target_year: "CBSE 2015, 2016, 2019"
  },

  // Carbon and its Compounds
  {
    id: "sci-ch4-q1",
    subject: "Science",
    chapter: "Carbon and its Compounds",
    question_text: "Draw the electron dot structure of Nitrogen.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Two nitrogen atoms share three pairs of electrons to form a triple bond: :N:::N: -> N≡N.",
    target_year: "CBSE 2021, 2023"
  },
  {
    id: "sci-ch4-q2",
    subject: "Science",
    chapter: "Carbon and its Compounds",
    question_text: "Write the chemical formula of benzene and draw its structure.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Molecular formula: C6H6. It forms a hexagonal ring with alternating single and double bonds between carbon atoms, each attached to one hydrogen atom.",
    target_year: "CBSE 2017, 2021, 2023"
  },
  {
    id: "sci-ch4-q3",
    subject: "Science",
    chapter: "Carbon and its Compounds",
    question_text: "What will you observe on adding a 5% alkaline KMnO4 solution drop by drop to some warm ethanol taken in a test tube? Write the name of the compound formed during the above chemical reaction.",
    options: [],
    correct_answer: "Subjective",
    explanation: "The purple color of KMnO4 decolourises and ethanoic acid (Acetic acid) is formed. Equation: CH3-CH2-OH (Alkaline KMnO4) -> CH3COOH.",
    target_year: "CBSE 2013, 2020"
  },
  {
    id: "sci-ch4-q4",
    subject: "Science",
    chapter: "Carbon and its Compounds",
    question_text: "Why do covalent compounds have low melting and boiling points?",
    options: [],
    correct_answer: "Subjective",
    explanation: "The molecules of covalent compounds are held by weak intramolecular forces. Thus, a very small amount of energy is required to break the bonds between two or more molecules.",
    target_year: "CBSE 2020, 2021"
  },
  {
    id: "sci-ch4-q5",
    subject: "Science",
    chapter: "Carbon and its Compounds",
    question_text: "What is meant by a homologous series of carbon compounds? Write the general formula of (a) alkenes (b) alkynes.",
    options: [],
    correct_answer: "Subjective",
    explanation: "The series of organic compounds having the same functional group and similar chemical properties is called a homologous series. General formula: (a) Alkene: CnH2n (b) Alkyne: CnH2n-2.",
    target_year: "CBSE 2014, 2015, 2016, 2019"
  },

  // Life Process
  {
    id: "sci-ch5-q1",
    subject: "Science",
    chapter: "Life Process",
    question_text: "(a) What is double circulation? (b) Why is the separation of the right side and the left side of the heartful useful? How does it help birds and mammals?",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) Circulation of blood through the heart twice during one complete cycle (pulmonary and systemic). (b) It prevents oxygenated and deoxygenated blood from mixing. In mammals and birds, this increases the efficiency of oxygen delivery, which is necessary for maintaining body temperature.",
    target_year: "CBSE 2019, 2022, 2023"
  },
  {
    id: "sci-ch5-q2",
    subject: "Science",
    chapter: "Life Process",
    question_text: "Explain the ways in which glucose is broken down in the absence or storage of oxygen?",
    options: [],
    correct_answer: "Subjective",
    explanation: "Glucose breaks down into pyruvate in the cytoplasm. Anaerobically (fermentation in yeast), pyruvate converts to ethanol and CO2. In human muscle cells during oxygen shortage, pyruvate converts to lactic acid. Both release very little energy.",
    target_year: "CBSE 2017, 2018, 2019"
  },
  {
    id: "sci-ch5-q3",
    subject: "Science",
    chapter: "Life Process",
    question_text: "(a) Write two water-conducting tissues present in plants. How does water enter continuously into the root xylem? (b) Explain why plants have low energy needs as compared to animals.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) Xylem tracheids and xylem vessels. Water enters root xylem due to transpiration and the resulting pressure gradient (transpirational pull). (b) Plants are autotrophic, do not move around, and possess many dead sclerenchyma cells requiring low maintenance.",
    target_year: "CBSE 2017, 2019, 2021"
  },
  {
    id: "sci-ch5-q4",
    subject: "Science",
    chapter: "Life Process",
    question_text: "In single-celled organisms, diffusion is sufficient to meet all their requirements for food, gas exchange, or removal of waste, but it is not in the case of multicellular organisms. Explain the reason for the difference.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Unicellular organisms have a high surface area to volume ratio, so simple diffusion meets their needs as the whole body is in contact with the environment. Multicellular organisms have a low ratio, and cells are not in direct contact with the environment, so specialized organs are needed.",
    target_year: "CBSE 2015, 2019, 2022"
  },
  {
    id: "sci-ch5-q5",
    subject: "Science",
    chapter: "Life Process",
    question_text: "Draw a diagram of the human alimentary canal and label the following: (1) part in which starch digestion is initiated (2) organ in which bile is stored (3) the gland that secretes digestive enzymes as well as hormones. (4) Part of the alimentary canal where water is reabsorbed. (5) Parts of the gut where finger-like projections are present to facilitate absorption of digested food.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Labels: (1) Mouth (2) Gall bladder (3) Pancreas (4) Large intestine (5) Small intestine.",
    target_year: "CBSE 2016, 2019, 2020"
  },

  // Control and Coordination
  {
    id: "sci-ch6-q1",
    subject: "Science",
    chapter: "Control and coordination",
    question_text: "Name a plant hormone responsible for bending of a shoot of a plant when it is exposed to unidirectional light. How does it promote phototropism?",
    options: [],
    correct_answer: "Subjective",
    explanation: "Auxins. Produced at the tips of shoots, they accumulate on the shaded side of the plant, causing cells there to elongate faster, which results in the shoot bending towards the light.",
    target_year: "CBSE 2019, 2023"
  },
  {
    id: "sci-ch6-q2",
    subject: "Science",
    chapter: "Control and coordination",
    question_text: "With the help of suitable examples explain the terms phototropism, geotropism and chemotropism.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Phototropism: Direction of growth in response to light (e.g., shoot bending upwards). Geotropism: Directional growth in response to gravity (e.g., roots growing downwards). Chemotropism: Growth in response to a chemical stimulus (e.g., pollen tube expanding towards the ovary).",
    target_year: "CBSE 2016, 2020"
  },
  {
    id: "sci-ch6-q3",
    subject: "Science",
    chapter: "Control and coordination",
    question_text: "Draw a diagram of the cross-sectional view of the human brain label the parts of the brain with the functions.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Medulla oblongata: Regulates reflex responses, involuntary actions (vomiting, blood pressure). Cerebellum: Directs voluntary movements, balance, and posture. Cerebrum (Forebrain): Thinking, speaking, reasoning. Olfactory lobes: Identifying odors. Diencephalon/Hypothalamus: Regulates temperature, appetite, thirst.",
    target_year: "CBSE 2017, 2020"
  },
  {
    id: "sci-ch6-q4",
    subject: "Science",
    chapter: "Control and coordination",
    question_text: "How does the feedback mechanism regulate hormone secretion? Explain with the help of an example?",
    options: [],
    correct_answer: "Subjective",
    explanation: "It keeps hormone balance stable. For example, eating carbohydrates raises blood glucose, prompting the pancreas to secrete insulin. As cells absorb glucose, blood sugar drops. This low level provides negative feedback, stopping insulin production to prevent shortages.",
    target_year: "CBSE 2017, 2019"
  },
  {
    id: "sci-ch6-q5",
    subject: "Science",
    chapter: "Control and coordination",
    question_text: "Name the part of human brain which control the voluntary and involuntary actions.",
    options: [],
    correct_answer: "Subjective",
    explanation: "The medulla controls involuntary actions, whereas the forebrain (cerebrum) and cerebellum are responsible for controlling voluntary actions.",
    target_year: "CBSE 2017, 2018"
  },

  // How do organisms reproduce?
  {
    id: "sci-ch7-q1",
    subject: "Science",
    chapter: "How do organisms reproduce?",
    question_text: "Difference between the asexual and sexual reproduction? Also, give one example of each.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Sexual: Involves two parents, gamete formation occurs, zygote forms, found in higher vertebrates. Asexual: Involves one parent, no gamete or sex organ formation, no zygote, found in lower organisms.",
    target_year: "CBSE 2016, 2018, 2021, 2022"
  },
  {
    id: "sci-ch7-q2",
    subject: "Science",
    chapter: "How do organisms reproduce?",
    question_text: "Describe reproduction by spores in Rhizopus.",
    options: [],
    correct_answer: "Subjective",
    explanation: "The fungus body is composed of hyphae which develop a sporangium at the tip. The sporangium contains tough, resistant spores. When the sporangium bursts, spores are dispersed to grow into new individuals.",
    target_year: "CBSE 2015, 2017, 2020, 2022"
  },
  {
    id: "sci-ch7-q3",
    subject: "Science",
    chapter: "How do organisms reproduce?",
    question_text: "List three techniques that have been developed to prevent pregnancy. Which one of these techniques is not meant for males? How does the use of these techniques have a direct impact on the health and prosperity of a family?",
    options: [],
    correct_answer: "Subjective",
    explanation: "1. Barrier (condoms). 2. Surgical (vasectomy for males, tubectomy for females). 3. IUDs (Copper T - not for males) & Oral pills (not for males). These help maintain gaps between children for maternal health and better resource utilization.",
    target_year: "CBSE 2017, 2018, 2020"
  },
  {
    id: "sci-ch7-q4",
    subject: "Science",
    chapter: "How do organisms reproduce?",
    question_text: "a. Draw a diagram of human female reproductive system and label the parts: Which produce an egg, Where fertilization takes place. B. List two bacterial diseases which are transmitted sexually. C. What are contraceptive devices? Give two reasons for adopting contraceptive devices in humans.",
    options: [],
    correct_answer: "Subjective",
   explanation: "A. Ovary produces eggs; Oviduct (Fallopian tube) is where fertilization occurs. B. Chlamydia, Gonorrhea, Syphilis. C. Devices to prevent pregnancy. Adopted to prevent unwanted pregnancies, control population, and prevent STDs.",
    target_year: "CBSE 2016, 2017, 2019"
  },
  
  // Heredity and Evolution
  {
    id: "sci-ch8-q1",
    subject: "Science",
    chapter: "Heredity and Evolution",
    question_text: "Mention any two points of difference between acquired and inherited traits. If the tail of a mouse is cut for twenty one generations, will the tail occur in the twenty second generation of that mouse? Give reason to support your answer.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Inherited: Passed via genes, passed from generation to generation (e.g., eye color). Acquired: Develops due to environment, not encoded in DNA, not passed down. The mouse will still have a tail in the 22nd generation because a cut tail is an acquired trait and doesn't change DNA.",
    target_year: "CBSE 2013, 2016, 2017, 2021, 2022"
  },
  {
    id: "sci-ch8-q2",
    subject: "Science",
    chapter: "Heredity and Evolution",
    question_text: "Two pea plants- one with round yellow seeds (RRYY) and another with wrinkled green (rryy) seeds produce F1 progeny that have round, yellow (RrYy) seeds. When F1 plants are self-pollinated, which new combination of characters is expected in F2 progeny? How many seeds with these new combinations of characters will be produced when a total 160 seeds are produced in F2 generation? Explain with reason.",
    options: [],
    correct_answer: "Subjective",
    explanation: "New combinations in F2: Round green and Wrinkled yellow. (Using a standard 9:3:3:1 ratio, the new combinations represent 3+3 = 6 parts out of 16). For 160 seeds, (6/16) * 160 = 60 seeds will have new combinations.",
    target_year: "CBSE 2018, 2020, 2022"
  },
  {
    id: "sci-ch8-q3",
    subject: "Science",
    chapter: "Heredity and Evolution",
    question_text: "List difference between dominant traits and recessive traits. What percentage of the plants in the F2 generation were round, in Mendel's dihybrid cross between round yellow and wrinkled green pea plants?",
    options: [],
    correct_answer: "Subjective",
    explanation: "Dominant traits are expressed even if only one allele exists. Recessive traits express only if both alleles are recessive. In a dihybrid cross, round (dominant) appears in 12 out of 16 plants (9 Round Yellow + 3 Round Green). Percentage = 75%.",
    target_year: "CBSE 2015, 2016, 2019"
  },
  {
    id: "sci-ch8-q4",
    subject: "Science",
    chapter: "Heredity and Evolution",
    question_text: "Sahil performed an experiment to study the inheritance pattern of genes. He crossed tall pea plants (TT) with short pea plants (tt) and obtained all tall plants in F1 generation. a. What will be the set of genes present in the F1 generation? b. Give reason why only tall plants are observed in F1 progeny.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) Tt. (b) According to Mendel's law of dominance, tallness (T) is a dominant trait and expresses itself over the recessive dwarfness (t) trait in the heterozygous F1 generation.",
    target_year: "CBSE 2016, 2021, 2022"
  },
  {
    id: "sci-ch8-q5",
    subject: "Science",
    chapter: "Heredity and Evolution",
    question_text: "In an asexually reproducing species, if a trait X exists in 5% of a population and trait Y exists in 70% of the same population, which of the two traits is likely to have arisen earlier? Give reason.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Trait Y likely arose earlier. In asexual reproduction, DNA copies identically and variations take a long time to spread. A trait present in 70% of the population would have had more generations to replicate compared to a trait present in only 5%.",
    target_year: "CBSE 2019, 2021"
  },

  // Light
  {
    id: "sci-ch9-q1",
    subject: "Science",
    chapter: "Light",
    question_text: "State the two laws of reflection of light.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(i) The angle of incidence is equal to the angle of reflection. (ii) The incident ray, the reflected ray, and the normal to the mirror at the point of incidence all lie in the same plane.",
    target_year: "CBSE 2011, 2013 2014"
  },
  {
    id: "sci-ch9-q2",
    subject: "Science",
    chapter: "Light",
    question_text: "The absolute refractive indices of glass and water are 1.5 and 1.33 respectively. In which medium does light travel faster? Calculate the ratio of speeds of light in the two media.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Light travels faster in the optically rarer medium, i.e., water. Ratio of speeds (v_glass / v_water) is inversely proportional to refractive indices = n_water / n_glass = 1.33 / 1.5 = 0.89.",
    target_year: "CBSE 2013, 2019, 2020"
  },
  {
    id: "sci-ch9-q3",
    subject: "Science",
    chapter: "Light",
    question_text: "The image of a candle flame placed at a distance of 30 cm from a mirror is formed on a screen placed in front of the mirror at a distance of 60 cm from it pole. What is the nature of the mirror? Find its focal length. If the height of the flame is 2.4 cm, find the height of its image. State whether the image formed is erect or inverted.",
    options: [],
    correct_answer: "Subjective",
    explanation: "u = -30, v = -60. Using 1/f = 1/u + 1/v, f = -20 cm. Mirror is concave. Magnification m = -v/u = -(-60)/(-30) = -2. Image height h2 = m * h1 = -2 * 2.4 = -4.8 cm. Since formed on a screen and magnification is negative, it is real and inverted.",
    target_year: "CBSE 2014, 2015, 2017"
  },
  {
    id: "sci-ch9-q4",
    subject: "Science",
    chapter: "Light",
    question_text: "Draw ray diagram to show the path of the refracted ray in each of the following cases. A ray of light incident on a concave lens (i) is parallel to its principal axis, (ii) is passing through its optical centre and (iii) is directed towards its principal focus.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(i) Parallel ray diverges, appearing to come from focus F1. (ii) Ray through optical centre passes without deviation. (iii) Ray directed towards F2 emerges parallel to the principal axis.",
    target_year: "Delhi 2013, CBSE 2015, 2016"
  },
  {
    id: "sci-ch9-q5",
    subject: "Science",
    chapter: "Light",
    question_text: "An object is placed at a distance of 50 cm from a concave lens of focal length 30 cm. (i) Use lens formula to find the distance of the image from the lens. (ii) List four characteristics of the image(nature, position, size, erect/inverted) formed by the lens in this case. (iii) Draw a ray diagram to justify your answer of pair (ii).",
    options: [],
    correct_answer: "Subjective",
    explanation: "u = -50 cm, f = -30 cm (concave lens). 1/v - 1/u = 1/f. 1/v = 1/-30 + 1/-50. v = -18.75 cm (or -150/8 cm). Note: Source calculation shows v = -20 cm derived from an incorrect u=-60 substitution in their text, but characteristics hold: Virtual, Erect, Diminished, Formed on the same side as the object.",
    target_year: "CBSE 2016, 2019"
  },
  // Human eye & colorful world
  {
    id: "sci-ch10-q1",
    subject: "Science",
    chapter: "Human eye & colorful world",
    question_text: "What is 'dispersion of white light'? State its cause. Draw a ray diagram to show the dispersion of white light by a glass prism.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Splitting of white light into its seven constituent colors due to refraction. Cause: Each color ray when passing through the prism bends at different angles with respect to the incident beam, giving rise to a spectrum.",
    target_year: "CBSE 2011, 2013, 2016, 2017"
  },
  {
    id: "sci-ch10-q2",
    subject: "Science",
    chapter: "Human eye & colorful world",
    question_text: "How will you use two identical glass prisms so that a narrow beam of white light incident on one prism emerges out of the second prism as white light? Draw and label the ray diagram.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Place the second identical prism in an inverted position with respect to the first prism. The first disperses the light, and the inverted second prism recombines the colors to form white light emerging from the other side.",
    target_year: "CBSE 2016, 2017, 2019, 2020"
  },
  {
    id: "sci-ch10-q3",
    subject: "Science",
    chapter: "Human eye & colorful world",
    question_text: "Draw a ray diagram to show the refraction of light through a glass prism. Mark on it (a) the incident ray, (b) the emergent ray and (c) the angle of deviation.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Diagram requirements: PE = incident ray, FS = emergent ray, Angle D = angle of deviation (angle between incident ray extended forward and emergent ray extended backward).",
    target_year: "CBSE 2011, 2013, 2017"
  },
  {
    id: "sci-ch10-q4",
    subject: "Science",
    chapter: "Human eye & colorful world",
    question_text: "State the function of each of the following parts of human eye: (i) Cornea (ii) Iris (iii) Pupil.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(i) Cornea: Transparent bulge that refracts most of the light entering the eye. (ii) Iris: Pigmented structure that regulates the amount of light entering. (iii) Pupil: Black hole in the center of the iris allowing light towards the retina.",
    target_year: "CBSE 2013, 2016, 2018"
  },
  {
    id: "sci-ch10-q5",
    subject: "Science",
    chapter: "Human eye & colorful world",
    question_text: "A student is unable to see clearly the words written on the black board placed at a distance of approximately 3 m from him. Name the defect of vision the boy is suffering from. State the possible causes of this defect and explain the method of correcting it.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Defect: Myopia (short-sightedness). Causes: Excessive curvature of the eye lens or elongation of the eyeball. Correction: Using a concave lens of suitable power to bring the image back onto the retina.",
    target_year: "CBSE 2017, 2018"
  },

  // Electricity
  {
    id: "sci-ch11-q1",
    subject: "Science",
    chapter: "Electricity",
    question_text: "(a) Prove that the equivalent resistance of three resistors R1, R2 and R3 in series is R1+R2+R3. (b) You have four resistors of 8 ohms each. Show how would you connect these resistors to have effective resistance of 8 ohms?",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) In series, current (I) is constant. Total voltage V = V1 + V2 + V3. Using Ohm's Law (V=IR), IR = IR1 + IR2 + IR3. Canceling I gives R = R1 + R2 + R3. (b) Connect two sets of parallel 8 ohm resistors in series. Each parallel pair gives 4 ohms. Series sum: 4 + 4 = 8 ohms.",
    target_year: "CBSE 2013, 2015, 2016"
  },
  {
    id: "sci-ch11-q2",
    subject: "Science",
    chapter: "Electricity",
    question_text: "State Ohm's law. Draw a labelled circuit diagram to verify this law in the laboratory. If you draw a graph between the potential difference and current flowing through a metallic conductor, what kind of curve will you get? Explain how would you use this graph to determine the resistance of the conductor.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Ohm's law states V is directly proportional to I, provided temperature remains the same (V = RI). The V-I graph is a straight line passing through the origin. The slope of the V-I graph at any point represents the resistance (R = V/I).",
    target_year: "CBSE 2014, 2015, 2016"
  },
  {
    id: "sci-ch11-q3",
    subject: "Science",
    chapter: "Electricity",
    question_text: "(i) State one difference between kilowatt and kilowatt hour. Express 1 kWh in joules. (ii) A bulb is rated 5V; 500 mA. Calculate the rated power and resistance of the bulb when it glows.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(i) Kilowatt (kW) is a unit of electric power. Kilowatt hour (kWh) is a commercial unit of energy. 1 kWh = 3.6 x 10^6 Joules. (ii) P = VI = 5V * 0.5A = 2.5W. R = V/I = 5V / 0.5A = 10 ohms.",
    target_year: "CBSE 2013, 2016"
  },
  {
    id: "sci-ch11-q4",
    subject: "Science",
    chapter: "Electricity",
    question_text: "Two lamps, one rated 100 W; 220 V, and the other 60 W; 220 V, are connected in parallel to electric mains supply. Find the current drawn by two bulbs from the line, if the supply voltage is 220 V.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Since connected in parallel, voltage is 220V across both. Current for 100W bulb: I1 = 100/220 = 0.454 A. Current for 60W bulb: I2 = 60/220 = 0.273 A. Total current I = I1 + I2 = 0.727 A (approx 0.73 A).",
    target_year: "CBSE 2014, 2018"
  },
  {
    id: "sci-ch11-q5",
    subject: "Science",
    chapter: "Electricity",
    question_text: "Draw a schematic diagram of a circuit consisting of a battery of 3 cells of 2 V each, a combination of three resistors of 10 ohms, 20 ohms and 30 ohms connected in parallel, a plug key and an ammeter, all connected in series. Use this circuit to find the value of the following: (a) Current through each resistor (b) Total current in the circuit (c) Total effective resistance of the circuit.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Voltage = 6V. (a) I_10 = 6/10 = 0.6 A, I_20 = 6/20 = 0.3 A, I_30 = 6/30 = 0.2 A. (b) Total current I = 0.6 + 0.3 + 0.2 = 1.1 A. (c) Total resistance: 1/Rp = 1/10 + 1/20 + 1/30 = 11/60 ohms. Rp = 60/11 ohms.",
    target_year: "CBSE 2020"
  },
   // Magnetic effects of current
  {
    id: "sci-ch12-q1",
    subject: "Science",
    chapter: "Magnetic effects of current",
    question_text: "State whether an alpha particle will experience any force in a magnetic field if (alpha particles are positively charged particles) (i) it is placed in the field at rest. (ii) it moves in the magnetic field parallel to field lines. (iii) it moves in the magnetic field perpendicular to field lines. Justify your answer in each case.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(i) No force. Only moving charged particles experience force. (ii) No force. A charged particle moving parallel (0 degrees) to the field experiences no force. (iii) Yes. It will experience maximum force in a direction perpendicular to both the magnetic field and its motion.",
    target_year: "CBSE 2016, 2022, 2023"
  },
  {
    id: "sci-ch12-q2",
    subject: "Science",
    chapter: "Magnetic effects of current",
    question_text: "Mention and explain the function of an earth wire. Why it is necessary to earth metallic appliances?",
    options: [],
    correct_answer: "Subjective",
    explanation: "An earth wire safely directs current to the ground if an appliance's insulation melts and live wires touch the metallic casing. This ensures the casing remains at zero potential, protecting users from severe electric shocks.",
    target_year: "CBSE 2014, 2016, 2020"
  },
  {
    id: "sci-ch12-q3",
    subject: "Science",
    chapter: "Magnetic effects of current",
    question_text: "Name and state the rule which is used to determine the direction of force on a current carrying conductor placed in a magnetic field.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Fleming's Left Hand Rule: Stretch the forefinger, middle finger, and thumb of your left hand mutually perpendicular. Forefinger indicates magnetic field direction, middle finger indicates current direction, then thumb indicates the direction of motion/force.",
    target_year: "CBSE 2020, 2022, 2023"
  },
  {
    id: "sci-ch12-q4",
    subject: "Science",
    chapter: "Magnetic effects of current",
    question_text: "What are magnetic field lines? Justify the following statements: (a) Two magnetic field lines never intersect each other. (b) Magnetic field are closed curves.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Imaginary continuous closed curves representing a magnetic field. (a) If they intersected, a compass needle at the intersection would point in two directions, which is impossible. (b) They emerge from the north pole and merge at the south pole externally, and move south to north internally, forming closed loops.",
    target_year: "CBSE 2013, 2015, 2016"
  },
  {
    id: "sci-ch12-q5",
    subject: "Science",
    chapter: "Magnetic effects of current",
    question_text: "What is solenoid? Draw the pattern of magnetic field lines of (i) a current carrying solenoid and (ii) a bar magnet. List two distinguishing features between the two fields.",
    options: [],
    correct_answer: "Subjective",
    explanation: "A solenoid is a coil of many circular turns of insulated copper wire wrapped in a cylinder shape. Distinctions: (a) Solenoid field is temporary (electromagnet) and exists only while current flows; bar magnet is permanent. (b) A solenoid's magnetic strength can be much stronger and easily adjusted compared to a bar magnet.",
    target_year: "Delhi 2019, 2020"
  },

  // Our Environment
  {
    id: "sci-ch13-q1",
    subject: "Science",
    chapter: "Our Environment",
    question_text: "How is ozone formed in the higher levels of the atmosphere? 'Damage to the ozone layer is a cause of concern'. Justify this statement.",
    options: [],
    correct_answer: "Subjective",
    explanation: "UV rays split oxygen molecules (O2) into free oxygen atoms (O), which combine with other O2 molecules to form O3 (Ozone). Damage is a concern because the ozone layer shields the earth from the Sun's harmful UV rays, which cause skin cancer and ecological damage.",
    target_year: "CBSE 2015, 2017, 2020, 2023"
  },
  {
    id: "sci-ch13-q2",
    subject: "Science",
    chapter: "Our Environment",
    question_text: "We do not clean ponds or lakes, but an aquarium needs to be cleaned regularly. Explain.",
    options: [],
    correct_answer: "Subjective",
    explanation: "Ponds and lakes are natural, self-sustaining ecosystems with natural decomposers that break down waste. An aquarium is an artificial, incomplete ecosystem that lacks adequate natural decomposers and therefore requires regular manual cleaning.",
    target_year: "CBSE 2017, 2023"
  },
  {
    id: "sci-ch13-q3",
    subject: "Science",
    chapter: "Our Environment",
    question_text: "Why are green plants called the producers?",
    options: [],
    correct_answer: "Subjective",
    explanation: "They are called producers because they manufacture their own food from simple inorganic compounds (carbon dioxide and water) using solar energy via photosynthesis, sustaining all other species.",
    target_year: "CBSE 2015, 2019"
  },
  {
    id: "sci-ch13-q4",
    subject: "Science",
    chapter: "Our Environment",
    question_text: "(a) How can we help in reducing the problem of waste disposal? Suggest any three methods. (b) Distinguish between biodegradable and non-biodegradable wastes.",
    options: [],
    correct_answer: "Subjective",
    explanation: "(a) 1. Reducing use of throwaway things. 2. Separating biodegradable from non-biodegradable waste. 3. Recycling non-biodegradable waste. (b) Biodegradable waste can be degraded by micro-organisms naturally (e.g., manure). Non-biodegradable waste cannot be degraded by natural methods and persists in the environment (e.g., plastics, DDT).",
    target_year: "CBSE 2013, 2015, 2019"
  },
  {
    id: "sci-ch13-q5",
    subject: "Science",
    chapter: "Our Environment",
    question_text: "Define an ecosystem. Draw a block diagram to show the flow of energy on an ecosystem.",
    options: [],
    correct_answer: "Subjective",
    explanation: "An ecosystem is a system composed of biotic (living) and abiotic (non-living) components and their interactions. Energy flow is unidirectional: Sun -> Producers -> Consumers -> Decomposers, with heat lost at each step.",
    target_year: "CBSE 2015, 2017, 2019"
  }
];

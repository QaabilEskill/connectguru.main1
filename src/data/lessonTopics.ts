export interface LessonTopic {
  id: number;
  title: string;
  description: string;
  conversations: Array<{
    question: string;
    answers: string[];
  }>;
}

export const lessonTopics: LessonTopic[] = [
  {
    id: 1,
    title: "Meeting & Greeting People",
    description: "Learn how to greet people and introduce yourself",
    conversations: [
      {
        question: "How are you?",
        answers: ["I am fine thank you."]
      },
      {
        question: "How are you doing?",
        answers: ["I am doing Great."]
      },
      {
        question: "How about you?",
        answers: ["I am also fine, Thanks."]
      },
      {
        question: "What do you do?",
        answers: ["i am a........"]
      },
      {
        question: "Where do you live?",
        answers: ["i am living in...."]
      },
      {
        question: "It was nice meeting you.",
        answers: ["Thanks, same here."]
      },
      {
        question: "Byeee, See you again.",
        answers: ["Ok Bye,see you soon."]
      }
    ]
  },
  {
    id: 2,
    title: "Use of 'May with Please'",
    description: "Learn polite ways to ask for permission and make requests",
    conversations: [
      {
        question: "May I please have your attention?",
        answers: ["Yes Sir/Ma'am."]
      },
      {
        question: "May I come in please?",
        answers: ["Yes, you may come in."]
      },
      {
        question: "May I please know your name?",
        answers: ["my name is....."]
      },
      {
        question: "May I go please?",
        answers: ["Yes, you may go."]
      },
      {
        question: "May I have a glass of water please?",
        answers: ["Yes, sure."]
      },
      {
        question: "May you help me please?",
        answers: ["Yes, how may I help you?"]
      },
      {
        question: "May I please say something?",
        answers: ["Yes, Please."]
      },
      {
        question: "May I please know more about this?",
        answers: ["Yes, What else you want to know?"]
      },
      {
        question: "May you please move a bit?",
        answers: ["Yes, why not."]
      },
      {
        question: "May I please use your pen for a while?",
        answers: ["Yes, Sure."]
      },
      {
        question: "May I please know this address?",
        answers: ["Yes, why not.", "Sorry I don't know."]
      },
      {
        question: "May I please meet you?",
        answers: ["Yes, why not."]
      },
      {
        question: "May I please speak to you?",
        answers: ["Yes, tell me."]
      }
    ]
  },
  {
    id: 3,
    title: "Self Introduction",
    description: "Learn how to introduce yourself properly",
    conversations: [
      {
        question: "What is your name?",
        answers: ["my name is...."]
      },
      {
        question: "What is your father's name?",
        answers: ["my father name is.."]
      },
      {
        question: "What is your mother's name?",
        answers: ["my mother name is....."]
      },
      {
        question: "Where are you from?",
        answers: ["i am from......"]
      },
      {
        question: "Which class are you in?",
        answers: ["i am in...."]
      },
      {
        question: "Which school you study in?",
        answers: ["my school name is..."]
      },
      {
        question: "What is your hobby?",
        answers: ["my hobby is............"]
      },
      {
        question: "What do you want to become?",
        answers: ["i want to become......."]
      }
    ]
  },
  {
    id: 4,
    title: "About Family",
    description: "Learn to talk about your family members",
    conversations: [
      {
        question: "How many members are there in your family?",
        answers: ["there are...."]
      },
      {
        question: "Who are there in your family?",
        answers: ["we are........."]
      },
      {
        question: "What is your father?",
        answers: ["my father is a..."]
      },
      {
        question: "What is your mother?",
        answers: ["my mother is a......"]
      },
      {
        question: "What is your sister?",
        answers: ["my sister is a....."]
      },
      {
        question: "What is your brother?",
        answers: ["my brother is a.."]
      }
    ]
  },
  {
    id: 5,
    title: "Describing People/Things",
    description: "Learn how to describe people and objects around you",
    conversations: [
      {
        question: "Who Are You?",
        answers: ["my name is...."]
      },
      {
        question: "Who is he? (For Male Person)",
        answers: ["He is my friend.", "He is my father.", "He is a Student.", "He is a Teacher.", "He is a Doctor."]
      },
      {
        question: "Who is she? (For Female Person)",
        answers: ["She is my friend.", "She is my mother.", "She is a Student.", "She is a Teacher.", "She is a Doctor."]
      },
      {
        question: "What is This/That? (For a Thing)",
        answers: ["This/That is a Chair.", "This/That is a Table.", "This/That is a Mobile.", "This/That is a Book.", "This/That is a Car."]
      }
    ]
  },
  {
    id: 6,
    title: "To have something",
    description: "Learn to express possession and ownership",
    conversations: [
      {
        question: "Do you have Mobile?",
        answers: ["Yes, I have Mobile.", "No, I don't have Mobile."]
      },
      {
        question: "Which mobile you have?",
        answers: ["I have Samsung/iPhone/Android mobile."]
      },
      {
        question: "Do you have a Cycle?",
        answers: ["Yes, I have a Cycle.", "No, I don't have Cycle."]
      },
      {
        question: "Do you have money?",
        answers: ["Yes, I have money.", "No, I don't have Money."]
      },
      {
        question: "How much money you have?",
        answers: ["I have 100rs./500rs./1000rs."]
      },
      {
        question: "Do you have your own house?",
        answers: ["Yes, I have own house.", "No, I have a rented house."]
      }
    ]
  },
  {
    id: 7,
    title: "Likings & Disliking",
    description: "Express your preferences and opinions",
    conversations: [
      {
        question: "Do you like travelling?",
        answers: ["Yes, I like travelling."]
      },
      {
        question: "Do you like watching TV/movie?",
        answers: ["Yes, I like watching TV/movie."]
      },
      {
        question: "Do you like playing games?",
        answers: ["Yes, I like playing games."]
      },
      {
        question: "Do you like chocolate?",
        answers: ["Of course, I like chocolate very much."]
      },
      {
        question: "Do you like studying English?",
        answers: ["Yes, I like studying English."]
      },
      {
        question: "Do you like helping poor?",
        answers: ["Yes, I like helping poor."]
      }
    ]
  },
  {
    id: 8,
    title: "Use of There Is/There Are",
    description: "Learn to describe what exists in places",
    conversations: [
      {
        question: "How many classrooms are there in your School?",
        answers: ["there are......"]
      },
      {
        question: "How many teachers are there in your school?",
        answers: ["there are....."]
      },
      {
        question: "Is there any computer lab in your school?",
        answers: ["Yes, there is a computer lab in our school."]
      },
      {
        question: "Is there any hospital in your village?",
        answers: ["Yes, there is a hospital in our village."]
      },
      {
        question: "How many stars are there in the sky?",
        answers: ["There are uncountable stars in the sky."]
      }
    ]
  },
  {
    id: 9,
    title: "Use of 'Will'",
    description: "Talk about future plans and intentions",
    conversations: [
      {
        question: "Will you drink Tea/Coffee?",
        answers: ["Yes, I will drink Tea/Coffee."]
      },
      {
        question: "Will you go to school today?",
        answers: ["Yes, I will go to school today."]
      },
      {
        question: "Will you come with me to market?",
        answers: ["Yes, I will come with you to market."]
      },
      {
        question: "Will you forget me?",
        answers: ["No, I will never forget you."]
      },
      {
        question: "Will you become an engineer?",
        answers: ["Yes, I will become an engineer.", "No, I will become a doctor."]
      }
    ]
  },
  {
    id: 10,
    title: "Use of 'Can'",
    description: "Express ability and capability",
    conversations: [
      {
        question: "Can you help me?",
        answers: ["Yes, I can help you.", "Sorry, I can't help you in this."]
      },
      {
        question: "Can you run fast?",
        answers: ["Yes, I can run fast.", "No, I can't run fast."]
      },
      {
        question: "Can you speak English?",
        answers: ["Yes, I can speak English."]
      },
      {
        question: "Can you swim?",
        answers: ["Yes, I can swim.", "No, I can't swim."]
      },
      {
        question: "Can you drive a car?",
        answers: ["Yes, I can drive a car.", "No, I can't drive a car."]
      }
    ]
  },
  {
    id: 11,
    title: "Use of 'Should & Must'",
    description: "Express obligations and recommendations",
    conversations: [
      {
        question: "Should we wake up early in the morning?",
        answers: ["We should wake up early in the morning."]
      },
      {
        question: "Should we go to school regularly?",
        answers: ["We must go to school regularly."]
      },
      {
        question: "Should we help each other?",
        answers: ["We must help each other."]
      },
      {
        question: "What should we do to succeed?",
        answers: ["We must do hard work to succeed."]
      },
      {
        question: "Should we obey our teachers & parents?",
        answers: ["We should obey our teachers & parents."]
      }
    ]
  },
  {
    id: 12,
    title: "Use of 'Going To'",
    description: "Talk about immediate future plans",
    conversations: [
      {
        question: "What are you going to do today?",
        answers: ["I am going to study.", "I am going to visit a friend.", "I am going to help my family."]
      },
      {
        question: "Are you going to school tomorrow?",
        answers: ["Yes, I am going to school.", "No, I am going to stay home."]
      },
      {
        question: "What is the teacher going to teach?",
        answers: ["The teacher is going to teach English.", "She is going to explain grammar."]
      }
    ]
  },
  {
    id: 13,
    title: "Use of 'Let's'",
    description: "Make suggestions and invite others",
    conversations: [
      {
        question: "Shall we start the class?",
        answers: ["Yes, let's start the class."]
      },
      {
        question: "Shall we go outside?",
        answers: ["Let's go outside."]
      },
      {
        question: "Shall we play football?",
        answers: ["Let's play football."]
      },
      {
        question: "Shall we study?",
        answers: ["Let's do study."]
      },
      {
        question: "Shall we eat food?",
        answers: ["Let's eat food."]
      }
    ]
  },
  {
    id: 14,
    title: "Present Continuous",
    description: "Talk about ongoing actions",
    conversations: [
      {
        question: "What are you doing?",
        answers: ["I am studying.", "I am reading a book.", "I am playing with friends.", "I am eating food."]
      },
      {
        question: "Where are you going?",
        answers: ["I am going to school.", "I am going to market.", "I am going home."]
      },
      {
        question: "Are you watching TV?",
        answers: ["Yes, I am watching TV.", "No, I am not watching TV."]
      },
      {
        question: "What is your mother doing?",
        answers: ["She is cooking.", "She is cleaning the house.", "She is working."]
      }
    ]
  },
  {
    id: 15,
    title: "Simple Past",
    description: "Talk about completed actions in the past",
    conversations: [
      {
        question: "Did you complete your homework?",
        answers: ["Yes, I completed my homework.", "No, I didn't complete my homework."]
      },
      {
        question: "Did you take your breakfast?",
        answers: ["Yes, I took my breakfast.", "No, I didn't take breakfast."]
      },
      {
        question: "Did you enjoy the party?",
        answers: ["Yes, I enjoyed the party."]
      },
      {
        question: "Did you watch the match?",
        answers: ["Yes, I watched the match.", "No, I didn't watch the match."]
      }
    ]
  },
  {
    id: 16,
    title: "Useful / Needful Things",
    description: "Learn about useful items and their purposes in daily life",
    conversations: [
      {
        question: "What we use to make a call?",
        answers: ["We use Mobile Phone."]
      },
      {
        question: "Why we need to study?",
        answers: ["We need to study to pass the exam."]
      },
      {
        question: "What we need to pass the exam?",
        answers: ["We need to study."]
      },
      {
        question: "What is use of trees?",
        answers: ["Trees give us rain, fresh air, fruits, vegetables and shadow."]
      },
      {
        question: "What is the use of Camera?",
        answers: ["We use camera to click photos and record videos."]
      },
      {
        question: "What is the use of Helmet?",
        answers: ["We use helmet for safety purpose."]
      },
      {
        question: "Why we need to learn spoken English?",
        answers: ["To develop our personality and to get a good job."]
      },
      {
        question: "Why need to sleep?",
        answers: ["We need to sleep to be healthy."]
      },
      {
        question: "What is the use of computer?",
        answers: ["We use computer to store data, to surf internet, to make our work easy."]
      },
      {
        question: "What we use to make tea?",
        answers: ["We use Milk, Tea leaves & Sugar."]
      },
      {
        question: "What we use to write?",
        answers: ["We use Pen or Pencil."]
      },
      {
        question: "What we use to write on?",
        answers: ["We use paper."]
      },
      {
        question: "What we need to sew clothes?",
        answers: ["We need Sewing Machine, Needle & Thread."]
      },
      {
        question: "What we use to drink Water/Tea/Coffee/Milk?",
        answers: ["We use Cup or Glass."]
      },
      {
        question: "What is the use of Refrigerator/Freeze?",
        answers: ["We use refrigerator to cool the water, to freeze the ice and to freshen the vegetables and fruits."]
      },
      {
        question: "Why we need water?",
        answers: ["We need water to drink, to take bath & to cultivate."]
      },
      {
        question: "What is the use of medicine?",
        answers: ["We use medicine to cure disease."]
      },
      {
        question: "What we need to open a bank account?",
        answers: ["We need Form, Photo Id & Address proof."]
      },
      {
        question: "What we use to travel?",
        answers: ["We Use Bike, Car, Bus, Train & Flight."]
      },
      {
        question: "What we use to take bath?",
        answers: ["We use Water, Soap, Shampoo & Towel."]
      },
      {
        question: "Why we need to exercise?",
        answers: ["We need to exercise to be healthy & fit."]
      },
      {
        question: "What is the use of scissors?",
        answers: ["We use scissors to cut clothes & paper."]
      },
      {
        question: "What is the use knife?",
        answers: ["We use knife to cut vegetables & fruits."]
      },
      {
        question: "What we use to build a building?",
        answers: ["We use cement, sand, bricks & stones."]
      },
      {
        question: "What we need to drive vehicles?",
        answers: ["We need fuel, Petrol or diesel."]
      },
      {
        question: "What we use to see?",
        answers: ["We use our eyes to see."]
      },
      {
        question: "What we use to chew food?",
        answers: ["We use our teeth to chew food."]
      },
      {
        question: "What we use to smell?",
        answers: ["We use our nose to smell."]
      },
      {
        question: "What we use to speak?",
        answers: ["We use our mouth to speak."]
      },
      {
        question: "What we use to hear/listen?",
        answers: ["We use our ears to hear/listen."]
      },
      {
        question: "What we use to taste?",
        answers: ["We use our tongue to taste."]
      },
      {
        question: "What we use to hold/catch?",
        answers: ["We use our hands to hold/catch."]
      },
      {
        question: "What we use to walk?",
        answers: ["We use our feet to walk."]
      }
    ]
  },
  {
    id: 17,
    title: "Routine Life Speech",
    description: "Practice describing your daily routine and activities",
    conversations: [
      {
        question: "Can you describe your daily routine?",
        answers: ["I get up at 6 o'clock in the morning. I get fresh. I go for morning walk and do exercise. After that I take breakfast. I get ready for the school. I go to school and we all do prayer. I attend all the lectures there. I take lunch at 12 o'clock. Then I attend remaining lectures. I leave school at 2 o'clock. I return to home and take rest for some time. After taking rest, I go to play with my friends. Then I get fresh and take dinner at 7 o'clock. I watch T.V. and then do study. And I go to bed at 10 o'clock."]
      }
    ]
  },
  {
    id: 18,
    title: "Use of 'I want' & 'I want to'",
    description: "Express your desires and needs using 'want' constructions",
    conversations: [
      {
        question: "What do you want?",
        answers: ["I want leave for 2 days."]
      },
      {
        question: "Why do you want leave?",
        answers: ["I want leave to attend my sister's/brother's marriage.", "I want leave to go my village.", "I want leave because I am not well.", "I want leave to attend family function."]
      },
      {
        question: "What do you want to eat?",
        answers: ["I want to eat fruits.", "I want to eat chapatti & lady finger.", "I want to eat Bhelpuri/Pani puri.", "I want to eat Sandwich/Ice cream."]
      },
      {
        question: "Do you want to eat something?",
        answers: ["Yes, I want to eat something.", "No, I don't want to eat anything."]
      },
      {
        question: "Do you want to drink Tea/coffee/Juice?",
        answers: ["Yes, I want to drink Tea/coffee/Juice.", "No, I don't want anything."]
      },
      {
        question: "Do you want a break?",
        answers: ["Yes, I want a break for some time."]
      },
      {
        question: "Do you want to go home?",
        answers: ["Yes, I want to go home."]
      },
      {
        question: "Do you want my help?",
        answers: ["Yes, I want your help.", "No, I don't want your help."]
      },
      {
        question: "Do you want to meet/talk me?",
        answers: ["Yes, I want to meet/talk you.", "No, I don't want to meet/talk you."]
      },
      {
        question: "What do you want to learn?",
        answers: ["I want to learn English."]
      },
      {
        question: "Why do you want to learn English?",
        answers: ["I want to learn English because it is useful everywhere.", "I want to learn English to get a good job."]
      },
      {
        question: "Where do you want to go?",
        answers: ["I want to go home/market.", "I want to go nowhere.", "I want to go to washroom."]
      },
      {
        question: "What do you want to know?",
        answers: ["I want to know nothing.", "I want to know about latest technology."]
      },
      {
        question: "Do you want to watch a movie?",
        answers: ["Yes, I want to watch a movie.", "No, I don't want to watch movie."]
      },
      {
        question: "Which movie do you want to watch?",
        answers: ["I want to watch 3 idiots/Pk/Heropanti."]
      },
      {
        question: "Do you want to see the Magic?",
        answers: ["Yes, I want to see the Magic."]
      },
      {
        question: "Do you want to dance?",
        answers: ["Yes, I want to dance.", "I want to sing a song."]
      },
      {
        question: "Do you want to sleep?",
        answers: ["Yes, I want to sleep.", "No, I don't want to sleep."]
      }
    ]
  },
  {
    id: 19,
    title: "'Would like to' Conversation",
    description: "Practice polite requests and offers using 'would like'",
    conversations: [
      {
        question: "Would you like to have food?",
        answers: ["Yes, I would like to have food."]
      },
      {
        question: "What would you like to have?",
        answers: ["I would like to have Haldi."]
      },
      {
        question: "Why would you like to have Haldi?",
        answers: ["Because, in winters I like Haldi."]
      },
      {
        question: "What would you like to have with Haldi? Chapati or Bati?",
        answers: ["I would like to have Bati."]
      },
      {
        question: "How many Batis would you like to have?",
        answers: ["I would like to have 3 Batis."]
      },
      {
        question: "And would you like to have something in sweet?",
        answers: ["I would like to have Carrot-pulp(HALWA) in sweet."]
      },
      {
        question: "What time/When would you like to have it?",
        answers: ["I would like to have it at around 7 o'clock."]
      }
    ]
  },
  {
    id: 20,
    title: "Tell about Weather/Climate",
    description: "Describe different weather conditions and climate",
    conversations: [
      {
        question: "How is the weather/climate?",
        answers: ["It is very cold here.", "It is very hot here.", "It is misty/foggy here.", "It is cloudy here.", "It is raining here.", "It is drizzling here.", "It is freezing cold here.", "It is pleasant here.", "It is breezy here.", "It is stormy here."]
      }
    ]
  },
  {
    id: 21,
    title: "Use of 'About To'",
    description: "Express immediate future actions using 'about to'",
    conversations: [
      {
        question: "What were you about to do?",
        answers: ["I was about to sleep.", "I was about to meet you.", "I was about to call you.", "I was about to come.", "I was about to go.", "I was about to fall but I escaped."]
      },
      {
        question: "What is about to happen?",
        answers: ["It is about to be dusk.", "The sun is about to rise.", "The sun is about to set.", "Winter is about to over.", "Summer is about to come.", "Match is about to start.", "Bus is about to arrive.", "Bus is about to depart.", "My birthday is about to come.", "Class is about to start.", "Food is about to prepare.", "He/she is about to marry."]
      },
      {
        question: "What were you about to tell?",
        answers: ["You were about to tell something."]
      }
    ]
  },
  {
    id: 22,
    title: "Use of 'If I Were' 'I Would'",
    description: "Practice hypothetical situations using conditional statements",
    conversations: [
      {
        question: "If you were India's PM, what would you do?",
        answers: ["If I were India's PM, I would develop the country."]
      },
      {
        question: "If you were a rich person, what would you do?",
        answers: ["If I were a rich person, I would help the poor."]
      },
      {
        question: "If you were a Santa Clause, what would you do?",
        answers: ["If I were a Santa Clause, I would give gifts to everyone."]
      },
      {
        question: "If you were a doctor, what would you do?",
        answers: ["If I were a doctor, I would treat the poor free of cost."]
      },
      {
        question: "If you were an angel, what would you do?",
        answers: ["If I were an angel, I would visit all the children."]
      },
      {
        question: "If you were a smile, what would you do?",
        answers: ["If I were a smile, I would always be on people's face."]
      },
      {
        question: "If you were a bird, what would you do?",
        answers: ["If I were a bird, I would fly high in the sky."]
      },
      {
        question: "If you were a star, what would you do?",
        answers: ["If I were a star, I would shine all the time."]
      }
    ]
  },
  {
    id: 23,
    title: "Questions & Answers 'WHAT'",
    description: "Practice asking and answering questions with 'What'",
    conversations: [
      {
        question: "What are you looking for?",
        answers: ["I am looking for my bag.", "I am looking for English book.", "We are looking for house on rent.", "I am looking for my mobile.", "I am looking for my friend/father/brother."]
      },
      {
        question: "What are you talking about?",
        answers: ["We are talking about computers.", "I am talking about my childhood.", "I am talking about elections."]
      },
      {
        question: "What happened?",
        answers: ["Nothing happened.", "Electricity went off.", "She is injured.", "My bike got punctured.", "I fell from cycle."]
      },
      {
        question: "What's the news?",
        answers: ["India won the match.", "I passed the exam.", "Petrol's prices are hiked."]
      },
      {
        question: "What's the problem?",
        answers: ["No problem.", "I am not feeling well.", "We don't have enough water to drink.", "I don't have sufficient money."]
      },
      {
        question: "What do you mean?",
        answers: ["I didn't mean that.", "I mean to say that."]
      },
      {
        question: "What is the time now?",
        answers: ["It is half past 8 (8:30).", "It is 5 to 10 (9:55).", "It is quarter past 12 (12:15).", "It is half to 4 (3:30).", "It is 1 o'clock.", "It is 2 o'clock.", "It is 3 o'clock.", "It is 4 o'clock.", "It is 5 o'clock.", "It is 6 o'clock.", "It is 7 o'clock.", "It is 8 o'clock.", "It is 9 o'clock.", "It is 10 o'clock.", "It is 11 o'clock.", "It is 12 o'clock."]
      }
    ]
  },
  {
    id: 24,
    title: "Questions & Answers 'Why'",
    description: "Practice asking and answering questions with 'Why'",
    conversations: [
      {
        question: "Why are you late?",
        answers: ["I had some work.", "I am sorry for being late."]
      },
      {
        question: "Why do we need to study?",
        answers: ["We need to study to pass the exam.", "We need to study to get a good job."]
      },
      {
        question: "Why do we wear helmet?",
        answers: ["We wear helmet for safety purpose."]
      },
      {
        question: "Why have you come here?",
        answers: ["I have come here to tell you something.", "I have come here to learn English.", "I have come here to meet you."]
      },
      {
        question: "Why are you crying?",
        answers: ["I am crying because I am hurt.", "These are the tears of happiness.", "Because my father scolded me.", "I am not crying.", "Because I am not feeling well."]
      },
      {
        question: "Why do you want leaves?",
        answers: ["I want leaves because I have fever.", "I want leaves because I have to attend my sister's/brother's marriage.", "I want leaves because I have some work."]
      },
      {
        question: "Why are you laughing?",
        answers: ["I am laughing on a joke.", "I am laughing because I am watching comedy show."]
      },
      {
        question: "Why were you not coming to the school?",
        answers: ["I was not coming to the school because I was ill.", "Because I went to Mumbai with my family."]
      },
      {
        question: "Why did you stop playing?",
        answers: ["We stopped playing because it's dark now."]
      },
      {
        question: "Why do you want to sleep early?",
        answers: ["I want to sleep early because I am tired."]
      },
      {
        question: "Why don't you say anything?",
        answers: ["Because I don't know anything about it."]
      },
      {
        question: "Why did you sell your mobile?",
        answers: ["Because it was not working properly.", "Because it was not useful to me."]
      }
    ]
  },
  {
    id: 25,
    title: "Questions & Answers 'Where'",
    description: "Practice asking and answering questions with 'Where'",
    conversations: [
      {
        question: "Where are you going?",
        answers: ["I am going to village.", "I am going to home.", "I am going to market.", "I am going to school.", "I am going nowhere."]
      },
      {
        question: "Where is your father?",
        answers: ["He is at work/home."]
      },
      {
        question: "Where are you?",
        answers: ["I am in the school/market.", "I am outside.", "I am at home."]
      },
      {
        question: "Where is your notebook?",
        answers: ["My notebook is in the bag."]
      },
      {
        question: "Where do you live?",
        answers: ["I live in hostel."]
      },
      {
        question: "Where are you from?",
        answers: ["I belong to Pali.", "I am from Pali."]
      },
      {
        question: "Where are other students?",
        answers: ["They are in the playground/hall/hostel.", "They are coming."]
      },
      {
        question: "Where you want to go for picnic?",
        answers: ["We want to go Mount Abu/Udaipur for picnic."]
      },
      {
        question: "Where is the principal ma'am?",
        answers: ["She is in the office.", "She is on leave today."]
      },
      {
        question: "Where were we?",
        answers: ["We were learning Modals/Tense/communication.", "We were talking about computer/mobile phone."]
      },
      {
        question: "Where is your family?",
        answers: ["My family is in village/Sumerpur/jodhpur/Bali."]
      },
      {
        question: "Where is the India Gate?",
        answers: ["India Gate is in New delhi."]
      },
      {
        question: "Where is the Red fort?",
        answers: ["The Red fort is in Delhi."]
      },
      {
        question: "Where is the Taj Mahal?",
        answers: ["Taj Mahal is in the Agra."]
      },
      {
        question: "Where is my mobile?",
        answers: ["It is lying on the table."]
      }
    ]
  },
  {
    id: 26,
    title: "Questions & Answers 'When'",
    description: "Practice asking and answering questions with 'When'",
    conversations: [
      {
        question: "When do you get up?",
        answers: ["I get up at 5/6/7 o'clock."]
      },
      {
        question: "When do we sleep?",
        answers: ["We sleep at night."]
      },
      {
        question: "When we take nap?",
        answers: ["We take nap at noon."]
      },
      {
        question: "When do you learn spoken English?",
        answers: ["I learn spoken English from 9 to 11 in the morning."]
      },
      {
        question: "When do you go to school?",
        answers: ["I go to school at 11 o'clock."]
      },
      {
        question: "When do you take lunch?",
        answers: ["I take lunch at 1 o'clock."]
      },
      {
        question: "When do you take dinner?",
        answers: ["I take dinner at 7 o'clock."]
      },
      {
        question: "When is your birthday?",
        answers: ["My birthday is on 28th March."]
      },
      {
        question: "When are you exams?",
        answers: ["My exams are in March/April."]
      },
      {
        question: "When do you go to home?",
        answers: ["I go to home in vacations."]
      },
      {
        question: "When do we celebrate Independence Day?",
        answers: ["We celebrate Independence Day on 15th August every year."]
      },
      {
        question: "When do we celebrate Republic Day?",
        answers: ["We celebrate Republic Day on 26th January every year."]
      },
      {
        question: "When do we celebrate Teachers Day?",
        answers: ["We celebrate Teachers Day on 5th September every year."]
      },
      {
        question: "When do we celebrate Children's Day?",
        answers: ["We celebrate Children's Day on 14th November every year."]
      },
      {
        question: "When do we celebrate Mahatma Gandhi's Birthday?",
        answers: ["We celebrate Mahatma Gandhi's Birthday on 2nd October every year."]
      },
      {
        question: "When do we celebrate Women's Day?",
        answers: ["We celebrate Women's Day on 8th March every year."]
      },
      {
        question: "When do we celebrate World Environment Day?",
        answers: ["We celebrate World Environment day on 5th June every year."]
      }
    ]
  },
  {
    id: 27,
    title: "Questions & Answers 'How'",
    description: "Practice asking and answering questions with 'How'",
    conversations: [
      {
        question: "How are you?",
        answers: ["I am fine thank you."]
      },
      {
        question: "How about you?",
        answers: ["I am also good, Thanks."]
      },
      {
        question: "How do you go to school?",
        answers: ["I go to school by walking.", "I go to school by bus.", "I go to school by cycle."]
      },
      {
        question: "How is your father/mother?",
        answers: ["He/she is fine."]
      },
      {
        question: "How old are you?",
        answers: ["I am 10/15/25 years old."]
      },
      {
        question: "How to open a bank account?",
        answers: ["You need to fill up a form and submit a photo id or address proof."]
      },
      {
        question: "How much for this bag/dress/mobile?",
        answers: ["This bag/dress/mobile will cost you..."]
      },
      {
        question: "How much for one kg apple/orange/grapes?",
        answers: ["It is 100 rs. for one kg."]
      },
      {
        question: "How much for half kg cabbage/tomato/cucumber?",
        answers: ["It is 20 rs. for half kg."]
      },
      {
        question: "How much time you study Spoken English?",
        answers: ["I study Spoken English for 2 hours."]
      },
      {
        question: "How many members you have in your family?",
        answers: ["there are....."]
      },
      {
        question: "How many friends you have?",
        answers: ["I have so many friends."]
      },
      {
        question: "How many classrooms are there in you school?",
        answers: ["there are....."]
      },
      {
        question: "How many teachers are there in your school?",
        answers: ["there are...."]
      },
      {
        question: "How many students are there in you hostel?",
        answers: ["there are..."]
      },
      {
        question: "How many Rs. you have?",
        answers: ["i have....."]
      },
      {
        question: "How many chapattis you eat?",
        answers: ["i eat.........."]
      },
      {
        question: "How many times you do brush?",
        answers: ["I do brush twice a day."]
      },
      {
        question: "How many times you eat food?",
        answers: ["I eat food twice a day."]
      },
      {
        question: "How many months are there in a year?",
        answers: ["There are 12 months in a year."]
      },
      {
        question: "How many days are there in a week?",
        answers: ["There are 7 days in a week."]
      }
    ]
  },
  {
    id: 28,
    title: "Questions & Answers 'Who'",
    description: "Practice asking and answering questions with 'Who'",
    conversations: [
      {
        question: "Who Are You?",
        answers: ["i am a.........."]
      },
      {
        question: "Who is he? (For Male Person)",
        answers: ["He is my friend.", "He is my father.", "He is (Name).", "He is a Student.", "He is a Teacher.", "He is a Doctor."]
      },
      {
        question: "Who is she? (For Female Person)",
        answers: ["She is my friend.", "She is my mother.", "She is (Name).", "She is a Student.", "She is a Teacher."]
      },
      {
        question: "Who is your hostel warden?",
        answers: ["my hostel warden name is....."]
      },
      {
        question: "Who is India's President?",
        answers: ["Mr. Ram Nath Kovind is India's President."]
      },
      {
        question: "Who is India's Prime Minister?",
        answers: ["Mr. Narendra Modi is India's Prime Minister."]
      },
      {
        question: "Who is Rajasthan's Chief Minister?",
        answers: ["Ms. Vasundra Raje Sindhiya is Rajasthan's Chief Minister."]
      },
      {
        question: "Who is collector of Pali district?",
        answers: ["Mr. Rohit Gupta is collector of Pali district."]
      },
      {
        question: "Who is your best friend?",
        answers: ["my best freind is............"]
      },
      {
        question: "Who is the Father of our nation?",
        answers: ["Mahatma Gandhi is the Father of our nation."]
      },
      {
        question: "Who is the Ironman of our nation?",
        answers: ["Sardar Vallabh Bhai Patel is Ironman of our nation."]
      },
      {
        question: "Who is the Master Blaster?",
        answers: ["Sachin Tendulkar is the Master Blaster."]
      }
    ]
  },
  {
    id: 29,
    title: "Questions & Answers 'Which'",
    description: "Practice asking and answering questions with 'Which'",
    conversations: [
      {
        question: "Which Class you study in?",
        answers: ["i am studing in....."]
      },
      {
        question: "Which School you study in?",
        answers: ["my school name is........"]
      },
      {
        question: "Which is the highest place in the world?",
        answers: ["Mount Everest is the highest place in the world."]
      },
      {
        question: "Which is the tallest animal in the world?",
        answers: ["Giraffe is the tallest animal in the world."]
      },
      {
        question: "Which is the biggest animal in the world?",
        answers: ["Whale is the biggest animal in the world."]
      },
      {
        question: "Which is the biggest state in India?",
        answers: ["Rajasthan is the biggest state India."]
      },
      {
        question: "Which day you like the most?",
        answers: ["I like Sunday because it's holiday."]
      },
      {
        question: "Which cricket team you support?",
        answers: ["I support Indian cricket team."]
      },
      {
        question: "Which mobile you have?",
        answers: ["I have Nokia/Samsung/Micromax/Gionee mobile.", "I don't have any mobile."]
      },
      {
        question: "Which is your favorite subject?",
        answers: ["English/Maths/Science is my favorite subject."]
      },
      {
        question: "Which is your favorite festival?",
        answers: ["Raksha Bandhan is my favorite festival."]
      },
      {
        question: "Which city is known as 'Lake City'?",
        answers: ["Udaipur is known as 'Lake City'."]
      },
      {
        question: "Which animal is known as 'Ship of Desert'?",
        answers: ["Camel is known as 'Ship of Desert'."]
      },
      {
        question: "What is this?",
        answers: ["any_name"]
      },
      {
        question: "Which soap you use?",
        answers: ["I use Lux/lifebuoy/Nirma soap."]
      },
      {
        question: "Which toothpaste you use?",
        answers: ["I use Colgate/Pepsodent toothpaste."]
      }
    ]
  },
  {
    id: 30,
    title: "Questions & Answers 'Whose'",
    description: "Practice asking and answering questions with 'Whose'",
    conversations: [
      {
        question: "Whose pen is this?",
        answers: ["This is my pen.", "This is his pen."]
      },
      {
        question: "Whose cycle is this?",
        answers: ["This is my cycle.", "This is his cycle."]
      },
      {
        question: "Whose house is this?",
        answers: ["This is my house.", "This house is of landlord."]
      },
      {
        question: "Whose hostel is this?",
        answers: ["This is girl's hostel.", "This is boy's hostel."]
      },
      {
        question: "Whose bag is this?",
        answers: ["This is my bag.", "This is his bag."]
      },
      {
        question: "Whose mobile is this?",
        answers: ["This is my Mobile.", "This is my father's/brother's mobile."]
      },
      {
        question: "Whose book/textbook is this?",
        answers: ["This is my book/textbook."]
      },
      {
        question: "Whose room is this?",
        answers: ["This is my room.", "This is his room."]
      }
    ]
  }
];

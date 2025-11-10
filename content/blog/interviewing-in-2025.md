---
published_at: 2025-11-10 1:15 PM
---
# Interviewing for Senior Software Eng Roles in 2025

After a couple of months of the grind I managed to land a new job (yay). My experience searching lined up with what I'd heard from friends that had recently been through the grind: it's hard to land a first interview and rejection rates are high throughout the funnel.

Back when I last interviewed nearly four years ago, I had the luxury of a job market that heavily favored more experienced applicants like me and only interviewed with a couple of companies. I got away with minimal prep and effort. To my current recollection I simply submitted an application, brought my honest self to a series of interviews, then found myself with an offer I was ready to take. Perhaps much of the detail is since lost or repressed.

Regardless, this search was much harder. So I figured I'd try to document my reflections in the hopes that someone else (or just future me) find them helpful in their search.

I think my success in landing offers came down to:

- Casting a wide net for my "top of funnel"
- Deliberately reflecting on my past work experience
- Developing a boilerplate strategy for system design interviews
- Re-familiarizing myself with coding in a tight time window with an audience

There's so much more to interviewing successfully than the above. I choose to focus on these topics as they either contribute to contemporary discourse on the current state of the market or felt particularly revelatory to me after going so long without being a candidate.

A quick disclaimer on my own context – I've been a [software engineer at startups for around 11 years](https://www.linkedin.com/in/jack-ratner-1359b45a/). I've held senior IC and manager roles for multiple years over that time. I suspect my past work experience helped with cold applications and first interview rates. I was primarily applying to "fullstack/product" Staff IC and team lead style roles at smaller startups (<= Series B).

## Landing those first interviews (top of funnel)

Getting a job is basically a user acquisition funnel. As an applicant you are a prospective employee (user) for a company, and there are many drop off points along the way to get there. The bigger your top of funnel as an applicant, the more likely you are to get to the end with one of the companies.

So I cast a pretty wide net for companies to apply to. I also found that taking intro interviews with a broad spectrum of companies was really helpful to practice "selling myself" and refine what was important to me in my next role.

Taking low stakes interviews where you are asked roughly the same questions you learn pretty quickly what sells and what smells about you. You learn better ways to talk about that career gap, or that strange looking role change. You also learn what gets recruiters and hiring managers excited to move you forward.

To actually get these interviews, like all of us (I presume), I used a mix of:

- cold applying
- recruiters
- referrals and networking

### "Cold" applying

I applied to several roles through familiar companies' job sites.

Themed job aggregator boards are good ways to discover roles. I used [Climatebase](https://climatebase.org/) to find several roles to apply to.

LinkedIn jobs also has roles. I applied to a couple that I never heard anything from. From past experience as a hiring manager, posting a role to LinkedIn is like trying to fill a bucket with a fire hose. Putting your hat in these thousand-hat pits isn't likely to yield much.

Many folks I've talked to that searched lately have said that they found cold applications to be a waste of time. In my case that wasn't entirely the case. I landed a handful of first rounds on cold applications alone. But my ratio of effort-to-success rate was certainly lower than working with recruiters or referrals.

I didn't write a single formal cover letter. For a couple of roles I wrote a paragraph or so outlining why I was really excited. I saw no correlation between the presence of a cover letter and getting a reply. I'm not sure that this is generalize-able advice as the sample size is of course extremely far from any statistical significance and my "cover letters" were quite minimal.

That said, I think that for more senior roles (management, Senior/Staff/etc. IC), resume matters so much more than cover letter. Having been a hiring manager too, this aligns with how I went about things. My gut says a cover letter is far more important to justify a substantial gap between your past experience and the target role (big co <> small co, management <> IC, Product <> Eng, ...) rather than convince them why you're a great fit. An exception here would be for smaller, mission-driven orgs where they specifically select for people that are passionate about the business. In these cases I would expect the posting to call out that they want to see this.

### Recruiters

The kind recruiters at [Recurse Center](https://www.recurse.com/) (aside - do a batch it's great :) ) gave me the best application->first interview rates. Also the level of effort at this stage on my end was trivial. The RC recruiter suggested a company and role, I decided whether it appealed to me, and then they presumably did the same with the company on the other side. If it was a mutual fit I had a first interview. No cover letters, no sending follow up emails on the status of my application, and a turnaround time within a few days if not hours.

I also landed an interview through a cold email from a recruiter internal to a company. 

The one firm-affiliated, cold email recruiter I chose to respond to rug-pulled the role on me. I think these firms tend to dangle a recent sexy looking role that was already filled then scuttle you to the contracts they are actually struggling to staff.

Again, low sample size, but working with an internal recruiter left me with much more control than one of these staffing agencies. Unlike the agencies, the RC recruiters draw from a highly connected community for their employment pool so are incentivized to work transparently and fairly. They're also just humble and kind people! I recommend finding a recruiter you can trust or working with recruiters within a single company.

Most of my interviews involved recruiters, despite this being the area of least effort for me at the application stage. I landed my new job through the Recurse recruiters.

### Referrals

I had a few referrals through connections as well. I found that the odds of role fit were lower here, since these were through friends that either work at or know people at companies and less about a particular role. I think this is still a great pathway to land a first interview, but I found for all of these I just didn't feel excited to move forward after the first round.

## Be prepared to interview

Being prepared to interview is the prevailing theme through the rest of this post. You can land an offer without being prepared (see me, four years ago). However, the odds of succeeding without preparation are lower and landing an interview at a place you're actually excited about isn't easy. So why take the risk?

The best way to be prepared is to be practiced. Sadly the best way to be practiced is to do actual interviews. Yes, I found mock interviews and preparing independently really helpful (read on for more advice here), but I found successes and rejections on actual interviews broke through my thick skull to create real lessons that I took into future processes. So if you have the time, take on interviews with companies you're on the fence about. And ask for feedback at each stage regardless of whether you succeed.

## Build a repository of past projects and experiences

Most interview processes will involve multiple interviews that dive into your past work experiences. I highly recommend creating a couple of documents for yourself of these experiences. I found writing them out helped me better see them objectively rather than waiting to rattle them off the dome in the moment of an interview. After going through this exercise I switched to using one of my most technically simple projects due to the role it played in the organization. Sometimes the projects that went smoothly are easy to trivialize upon reflection, but that they went smoothly is part of what makes them (and you as a contributor or lead on it) great!

But please, don't script your stories word for word. Sounding "over-practiced" can be off-putting for your interviewers. Pausing to ask clarifying questions about what your interviewer is looking for can help you stay genuine and show how you can adapt in the moment. Just remember that you did this work, you don't need a word-for-word script, you were there! Just trust yourself and be genuine about your contributions and learning.

### Past projects

One common interview is a "past project deep dive" style interview. The interviewer will ask you to select and project from your past work experiences and walk them through a variety of aspects of it. Interviewers will often ask questions that touch on:

- What was the business context (Why did this project get prioritized, What made it important, etc.)?
- What was your role in it?
- What were the functional requirements?
- What did you build?
- Did you have a high-level understanding of the solution space and how it fit in the wider tech at the org?
- How was success evaluated (did you use metrics, user feedback, etc.)?
- What did you learn?

I wrote down major projects from my past, with answers (or just little bullet reminders of topics) for each of the above questions. This made it much easier for me to identify good projects for different areas of discussion: one showing the biggest business impact, one I retained the best technical understanding of, one with the most mistakes and lessons learned. These became potential projects to mention in an interview, so I didn't have to sit and stew for minutes trying to recall or pick the best project where I _[...insert prompt here...]_.

There is NO right answer to these kinds of questions. Most interviewers care more about that you can discuss these angles of a project, rather than doing any particular solution or strategy. There's no need to avoid discussing failures as no project is ever perfect. Just make sure to have a lesson or reflection to share about the failure. Discussing failure requires balance, though. Don't blame others too much (you come off as lacking humility and awareness of your own role in the failure), but don't be so focused on your own failures that you forget to show why you're talented and useful!

### Past work experiences

There will almost always be soft skills interviews or at least questions in an interview process. These are often of the format "tell me about a time when _____." I found it helpful to gather a few example questions and write out potential topics for each from my past experience. This was useful for recall so, again, I don't waste time in the interview trying to recall something relevant. Interviewers really want concrete examples for these, not generalizations or hypotheticals ("well in that kind of situation I would...").

My pre-baked questions were:

- Tell me about a time you went above and beyond
- Tell me about a time you didn't give up
- Tell me about a time you navigated a conflict in the organization
- Tell me about a time you saw a problem and fixed it

I was asked things on my interviews outside of these, but often times a past experience can be relevant to a variety of these sorts of questions. Having taken the time to reflect and wrap my head around those experiences made me much more prepared to generate thoughtful and relevant sounding answers.

### System Design

I had to fail two system design interviews before I realized that I needed to change my approach. Simply showing up to interviews while trusting my past experience building and designing systems clearly was not working. The reality was as soon as I got into the interview trust faded away to panic as I came to terms with having only 40 minutes to design a perfect solution to a technical prompt I'd only just been given.

A system design interview is not an interview in which you are expected to design a perfect solution to a problem. Anyone who expects you to do that in 40-60 minutes is a highly confused individual. Expecting this of myself made _me_ a highly confused individual. And this confusion really showed in these interviews I'd bombed.

Rather than build a perfect design to solve the prompt, your interviewers likely want to see you:

- Effectively gather requirements to develop a rough understanding of a domain
- Demonstrate domain modeling skills
- Detect complexity
- Sketch a rough solution with tech and discuss some implied tradeoffs
- Communicate clearly
- Manage time effectively

For more senior roles your interviewer is not going to guide you through these things. They want to see you drive the agenda and topics to assess your time management and judgment skills.

There is good news: you can standardize a process for ensuring you cover all the above expectations! Having a format in mind gave me the structure I needed to stay on track. It helped to keep the self-defeating urgency urge at bay ("But I only have 25 minutes left and I haven't started diagramming systems yet" is a counter-productive thought).

To build my format I read through [parts 1-3 of this article](https://interviewing.io/guides/system-design-interview#introduction-to-system-design) and took notes to build up my own strategy. See **Appendix A**)) at the end of this post for the output of that exercise. In my case (as you can obviously glean from my notes), you don't need something perfect. The exercise of engaging deeply with what I want to cover was enough for me. You don't need to focus on the same topics as what I've noted - you can and should shape your process to your areas of knowledge.

Another tip here - I found myself focusing heavily on things I didn't know in these interviews earlier on. It's good to acknowledge when you don't know things (it shows humility, after all - and all good interviewers know that no one knows everything), but you can't tip off the humility cliff into the self-deprecating pit. There is an infinite amount of terrain you can cover in a system design interview and limited time, so you have leeway to move things toward your areas of expertise. Remember, your interviewer knows little-to-nothing about you. When relevant, take the extra moment to go deeper on a technical design decision to demonstrate your knowledge of a tradeoff or system. Knowledge tends to feel obvious to you once you have it, but it's the very nuggets that are obvious to you but not everyone else that make your value as a senior engineer. I ended up writing out a few tips like this I could refer back to remember what this interview is all about (see **Appendix B**)!

One last note - an interviewer asked me about "non-functional requirements" for the design. Having not yet studied system design interviews, I was bewildered by this phrase. This is a technical interview in which we design a system, all requirements are inherently technical! I believe this phrase "non-functional requirements" refers to _implicit requirements_ that are not explicitly asked for. These are things like scale needs (throughput, volume of data), timeliness needs (online vs offline systems, frequency of running), data durability needs, security considerations, failure scenarios and monitoring, and so on. I still dislike the term "non-functional" for these as they are still capabilities and constraints on the system, but regardless I've found that interviewers very much want to see you touch on these topics.

### Coding interviews

I've written a fair amount of code in my career. But having been a few years out of interviewing, I wasn't as fresh at building working solutions to unfamiliar prompts within 40-60 minutes. Especially because I'd been taking my time off to dabble in new languages and grow my knowledge, rather than doing the more typical work on the job of building in highly familiar programming languages and frameworks.

In my first few interviews, I found myself searching docs on some simpler syntactical paradigms like iterating lists with members and indexes. While many interviewers won't ding you for looking up docs, this is time you could be spending further down in the prompt. Even if you know your interviewer doesn't care, you might carry the fact that you looked up iterator syntax in python through the rest of the interview, further eating away at your cognitive capacity.

My answer to this problem? I picked one or two languages that I expected to be interviewed in. In my case python and TypeScript had me covered for all my interviews. Then practice coding interview style prompts in that language. The free tier on [Leetcode](https://leetcode.com/) had more than enough prompts to get me going. I used the web IDE on Leetcode as most interviewers still seem to be using [Coderpad](https://coderpad.io/). After doing several practice prompts I'd guess my basic python and TypeScript speed of development roughly doubled.

As a variant on coding prompts, many companies had interviews where they'd drop me into an existing project and ask me to fix bugs and add features. These practical interviews look for skills that better represent day-to-day work: working with databases, web app API boundaries, UX tradeoffs. I recommend making sure you aren't too rusty with React, building RESTful APIs, and writing SQL queries before going into this sort of interview. Build a small to-do app or something!

I wasn't asked any deep data structures and algorithms in my interviews. While this is probably a symptom of the sorts of places I like to apply (practical over pretense), most problems are solve-able with a combination of hashmaps, arrays, and sets. Knowing these data structures and having an intuition for how performant inserts, lookups, and removals are on these structures was sufficient for all my interviews.

### Practice Plus: Mock interviews

A couple of folks from the Recurse Center community very kindly ran mock interviews with me. These were very helpful because they were they only way I could get feedback on my approach outside of real interviews. And many interviewers won't share feedback, and most won't share very much even if they share some. Mock interviews also impose time deadlines, which I found hard to enforce when I practiced independently. They also force you to practice your communication, which if you are not comfortable narrating as you code you should _definitely_ get some reps in on (a silent candidate is unlikely to pass a coding screen in my experience).

Because I was connected to my mock interviewers through a coding community I hadn't met them prior to our mock session. I think this was really helpful for simulating the nerves of a real interview, rather than doing a mock with an old buddy from a past job. Maybe ask your coding friends for one of their coding friends you don't know to interview you?

## Wrapping up

Cast a wide net. If nothing else, you'll get your reps in and refine your interview skills talking with companies you probably don't want to work at. You also might be pleasantly surprised - just because a company doesn't initially look like a fit, the judgments you formed up front can change with deeper digging. Besides, a sleek landing page, sexy sounding product, and good press don't necessarily make a great place to work.

Interview readiness and job readiness are not the same thing. I learned this the hard way by failing several interviews early on. Save yourself the trouble of being unnecessarily rejected by companies you're excited by and do some prep!

## Appendix A: My janky notes for system design format

```
1. Requirements!
	1. Explore and identify implementation space
		1. Confirm high-level requirements with interviewers!
		2. Listen for specific details -- these ARE relevant
	2. Identify "non-functional" requirements
		1. Performance considerations
			1. Latency (where are response times needed to be fast, worst case vs average case)
			2. Scalability/throughput (where is load most expected?)
		2. Availability
			1. Where is downtime tolerable?
		3. Consistency
			1. Where is there tolerance to relax guarantees (stale reads, dropped writes) (think a social media feed)
			2. Opportunities to trade off for availability
			3. Opportunities to trade off for performance
		4. Data security
			1. Durability (how bad is data loss: solutions: replication, backups, etc)
			2. Compliance and exposure risk (PII, compliance)
			3. Internal vulnerabilities (remote code execution, user-submitted data, sql injection, etc)
		5. Devices (client devices - mobile, web clients, hardware, etc)
2. State, access patterns, scale
	1. Key pieces of state or entities that need to be managed
		1. Any special types of data are relevant (blob, coordinates, nuanced ids, etc)
		2. modeling + index details, where there's seeming complexity or ambiguity worth clarifying
	2. APIs / explicit access patterns
		1. REST, GraphQL, RPC, Websocket, SSE
	3. Rough throughput on reads and writes on the APIs
		1. Do back of the envelope calcs!
3. Design
	1. Notable tools (storage, communication protocols)
	2. Services
```


## Appendix B: System design tips and reminders

- Develop a solid understanding of the implementation space! Don't rush into a solution -- understand requirements AND secondary/fallout implications on the system of those requirements
- Dive into areas where you feel confident -- don't assume the interviewer already "trusts" I know it -- dig in and prove it!
- There is no right answer! Just make a best attempt at something you think will work, and be vocal about tradeoffs
- This is NOT about deep expertise. This is a great opportunity to show off my experience as a generalist.
- Identify why your tool choice is good! Mention drawbacks, but don't fixate only on the negatives.
- If struggling on where to go next, after a pause, don't be afraid to ask the interviewer for guidance.
- Don't be afraid to use silence to be thoughtful. It's good to be communicative, but I don't have to communicate every single idea that pops into my head.

export function validateProfile({username,bio}){
  if(typeof username!=="string"||username.trim().length<2||username.trim().length>40) return "Name must be between 2 and 40 characters";
  if(typeof bio!=="undefined"&&(typeof bio!=="string"||bio.length>500)) return "Bio must be 500 characters or fewer";
  return null;
}

export function validateChallenge({title,prompt,startsAt,endsAt}){
  if(typeof title!=="string"||!title.trim()||title.trim().length>120) return "Challenge title is required and must be 120 characters or fewer";
  if(typeof prompt!=="string"||!prompt.trim()||prompt.trim().length>3000) return "Challenge prompt is required and must be 3000 characters or fewer";
  const start=new Date(startsAt);
  const end=new Date(endsAt);
  if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start) return "Challenge end must be after its start";
  return null;
}

export function validateSubmission({title,body}){
  if(typeof title!=="string"||!title.trim()||title.trim().length>160) return "Submission title is required and must be 160 characters or fewer";
  if(typeof body!=="string"||!body.trim()||body.length>20000) return "Submission text is required and must be 20000 characters or fewer";
  return null;
}

export function validateReport({reason,details}){
  if(!["copyright","harassment","spam","other"].includes(reason)) return "Choose a valid report reason";
  if(typeof details!=="undefined"&&(typeof details!=="string"||details.length>2000)) return "Report details must be 2000 characters or fewer";
  return null;
}
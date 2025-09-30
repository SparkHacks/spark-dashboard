import "./ApplicationStatus.css";
// application status message
// "waiting" , "declined" , "waitlist" , "accepted" , "userAccepted" , "fullyAccepted" 

export default function ApplicationStatus ({message}: {
  message: string | ""
}) 
  {  
    var statusMessage = ""
    var one = false;
    var two = false;
    var three = false;
    switch (message)
    {
      case 'waiting':
        statusMessage = "Submitted ✅";
        one = true;
        break;
      case 'declined':
        statusMessage = "Declined ❌";
        break;
      case 'waitlist':
        statusMessage = "Submitted ✅";
        one = true;
        break;
      case 'accepted':
        statusMessage = "Invited 🎉"
        one = true;
        two = true;
        break;
      case 'userAccepted':
        statusMessage = "Accepted 🎉"
        one = true;
        two = true;
        three = true;
        break;
      case 'fullyAccepted':
        statusMessage = "Accepted 🎉"
        one = true;
        two = true;
        three = true;
    }

    return (
      <div>
          <h2 style={{color: "black", fontWeight: "bold", textWrap: "wrap"}}>Application Status: <span className={message}>{statusMessage}</span>| <a style={{color: "black"}} href="/adminapplication">View Application</a> </h2>
          <div className="svg-container">
            <svg viewBox="0 0 1000 100" height="50%" width="100%" xmlns="http://www.w3.org/2000/svg">
              
              <line x1="10%" y1="50%" x2="35%" y2="50%" className={`${one ? "waiting" : "emptyStatus"}`} style={{strokeWidth: "3%"}} />
              <line x1="35%" y1="50%" x2="65%" y2="50%" className={`${two ? "accepted" : "emptyStatus"}`} style={{strokeWidth: "3%"}} />
              <line x1="65%" y1="50%" x2="90%" y2="50%" className={`${three ? "fullyAccepted" : "emptyStatus"}`} style={{strokeWidth: "3%"}} />
              
              <circle r="3%" cx="10%" cy="50%" className={`${one ? "waiting" : "emptyStatus"}`} />
              <circle r="3%" cx="35%" cy="50%" className={`${one ? "waiting" : "emptyStatus"}`} />
              <circle r="3%" cx="65%" cy="50%" className={`${two ? "accepted" : "emptyStatus"}`} />
              <circle r="3%" cx="90%" cy="50%" className={`${three ? "fullyAccepted" : "emptyStatus"}`} />
            </svg>
            
            <div className="text-container">
              <h3 className={`${one ? "waiting" : "emptyStatus"}`}>Not Started</h3>
              <h3 className={`${one ? "waiting" : "emptyStatus"}`}>Pending Review</h3>
              <h3 className={`${two ? "accepted" : "emptyStatus"}`}>Receive Decision</h3>
              <h3 className={`${three ? "fullyAccepted" : "emptyStatus"}`}>Accept Invitation</h3>
            </div>
            

          </div>
      </div>
    );
  }


import { createApp } from "app/create";
import * as React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

class AppLoader extends React.Component<
  object,
  { bootstrap?: { content: string } }
> {
  constructor(props: object) {
    super(props);
    this.state = { bootstrap: undefined };
  }

  componentDidMount() {
    fetch("api")
      .then((res) => res.json())
      .then(({ content }) => {
        if (content) {
          this.setState({ bootstrap: { content: content } });
        }
      });
  }

  render() {
    if (this.state.bootstrap) {
      return createApp(this.state.bootstrap);
    } else {
      return <div>Loading...</div>;
    }
  }
}

/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
createRoot(document.getElementById("root")!).render(<AppLoader />);

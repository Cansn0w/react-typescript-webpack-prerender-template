import { createApp } from "app/create";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Bootstrap } from "types";
import "./styles.css";

class AppLoader extends React.Component<object, { bootstrap?: Bootstrap }> {
  constructor(props: object) {
    super(props);
    this.state = { bootstrap: undefined };
  }

  componentDidMount() {
    fetch("data/")
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

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase("db.db");

const { height, width } = Dimensions.get("window");

class Items extends React.Component {
  state = {
    items: null
  };

  componentDidMount() {
    this.update();
  }

  render() {
    const { done: doneHeading } = this.props;
    const { items } = this.state;
    const heading = doneHeading ? "Completed" : "Todo";

    if (items === null || items.length === 0) {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>{heading}</Text>
        {items.map(({ id, done, value }) => (
          <TouchableOpacity
            key={id}
            onPress={() => this.props.onPressItem && this.props.onPressItem(id)}
            style={{
              backgroundColor: done ? "#1c9963" : "#F23657",
              borderColor: "#000",
              borderWidth: 1,
              padding: 8
            }}
          >
            <Text style={{ color: done ? "#fff" : "#000" }}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  update() {
    db.transaction(tx => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [this.props.done ? 1 : 0],
        (_, { rows: { _array } }) => this.setState({ items: _array })
      );
    });
  }
}

export default class App extends React.Component {
  state = {
    text: null
  };

  componentDidMount() {
    db.transaction(tx => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, value text);"
      );
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>To Do List</Text>
        <View style={styles.flexRow}>
          <TextInput
            onChangeText={text => this.setState({ text })}
            onSubmitEditing={() => {
              this.add(this.state.text);
              this.setState({ text: null });
            }}
            placeholder="할 일 적기"
            style={styles.input}
            value={this.state.text}
          />
        </View>
        <View style={styles.card}>
        <ScrollView style={styles.listArea}>
          <Items
            done={false}
            ref={todo => (this.todo = todo)}
            onPressItem={id =>
              db.transaction(
                tx => {
                  tx.executeSql(`update items set done = 1 where id = ?;`, [
                    id
                  ]);
                },
                null,
                this.update
              )
            }
          />
          <Items
            done={true}
            ref={done => (this.done = done)}
            onPressItem={id =>
              db.transaction(
                tx => {
                  tx.executeSql(`delete from items where id = ?;`, [id]);
                },
                null,
                this.update
              )
            }
          />
        </ScrollView>
        </View>
      </View>
    );
  }

  add(text) {
    // is text empty?
    if (text === null || text === "") {
      return false;
    }

    db.transaction(
      tx => {
        tx.executeSql("insert into items (done, value) values (0, ?)", [text]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
      this.update
    );
  }

  update = () => {
    this.todo && this.todo.update();
    this.done && this.done.update();
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F23657",
    flex: 1,
    paddingTop: Constants.statusBarHeight
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center"
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8
  },
  card: {
    backgroundColor: "white",
    flex:1,
    width: width -25,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginLeft: 12,
  },
  listArea: {
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8
  }
});
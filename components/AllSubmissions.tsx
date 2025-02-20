import type React from "react"
import { useState } from "react"
import { View, StyleSheet } from "react-native"
import { DataTable, Searchbar, Menu } from "react-native-paper"

interface Submission {
  id: number
  subject: string
  teacher: string
  date: string
  status: string
}

const AllSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([
    { id: 1, subject: "Mathematics", teacher: "John Doe", date: "2023-05-01", status: "Submitted" },
    { id: 2, subject: "Science", teacher: "Jane Smith", date: "2023-05-02", status: "Pending" },
    { id: 3, subject: "English", teacher: "Alice Johnson", date: "2023-05-03", status: "Submitted" },
    { id: 4, subject: "History", teacher: "Bob Wilson", date: "2023-05-04", status: "Submitted" },
    { id: 5, subject: "Geography", teacher: "Carol Brown", date: "2023-05-05", status: "Pending" },
  ])

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects")
  const [menuVisible, setMenuVisible] = useState<boolean>(false)

  const onChangeSearch = (query: string) => setSearchQuery(query)

  const filteredSubmissions = submissions.filter(
    (submission) =>
      (selectedSubject === "All Subjects" || submission.subject === selectedSubject) &&
      (submission.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.teacher.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <View>
      <Searchbar placeholder="Search" onChangeText={onChangeSearch} value={searchQuery} style={styles.searchBar} />
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={<Menu.Item onPress={() => setMenuVisible(true)} title={selectedSubject} />}
      >
        <Menu.Item
          onPress={() => {
            setSelectedSubject("All Subjects")
            setMenuVisible(false)
          }}
          title="All Subjects"
        />
        <Menu.Item
          onPress={() => {
            setSelectedSubject("Mathematics")
            setMenuVisible(false)
          }}
          title="Mathematics"
        />
        <Menu.Item
          onPress={() => {
            setSelectedSubject("Science")
            setMenuVisible(false)
          }}
          title="Science"
        />
        <Menu.Item
          onPress={() => {
            setSelectedSubject("English")
            setMenuVisible(false)
          }}
          title="English"
        />
        <Menu.Item
          onPress={() => {
            setSelectedSubject("History")
            setMenuVisible(false)
          }}
          title="History"
        />
        <Menu.Item
          onPress={() => {
            setSelectedSubject("Geography")
            setMenuVisible(false)
          }}
          title="Geography"
        />
      </Menu>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Subject</DataTable.Title>
          <DataTable.Title>Teacher</DataTable.Title>
          <DataTable.Title>Date</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
        </DataTable.Header>

        {filteredSubmissions.map((submission) => (
          <DataTable.Row key={submission.id}>
            <DataTable.Cell>{submission.subject}</DataTable.Cell>
            <DataTable.Cell>{submission.teacher}</DataTable.Cell>
            <DataTable.Cell>{submission.date}</DataTable.Cell>
            <DataTable.Cell>{submission.status}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    marginBottom: 16,
  },
})

export default AllSubmissions

